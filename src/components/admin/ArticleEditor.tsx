'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TARGET_LOCALES } from '@/lib/translation';

const LOCALE_NAMES: Record<string, string> = {
  en: 'English', vi: 'Tiếng Việt', zh: '中文', hi: 'हिन्दी', es: 'Español',
  pt: 'Português', fr: 'Français', de: 'Deutsch', ar: 'العربية', ru: 'Русский',
  ja: '日本語', ko: '한국어',
};

interface Translation { locale: string; title: string; excerpt: string; content: string; isAutoTranslated: boolean; }
interface ArticleData {
  slug: string; status: string; category: string; coverImage: string;
  translations: Translation[];
}

const MARK = { title: '===== TITLE =====', excerpt: '===== EXCERPT =====', content: '===== CONTENT =====' };

export function ArticleEditor({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);

  // Khung trái: bản gốc EN
  const [en, setEn] = useState<Translation>({ locale: 'en', title: '', excerpt: '', content: '', isAutoTranslated: false });
  const [meta, setMeta] = useState({ slug: '', status: 'DRAFT', category: '', coverImage: '' });

  // Khung phải: bản dịch đang chọn
  const [rightLocale, setRightLocale] = useState<string>(TARGET_LOCALES[0]);
  const [right, setRight] = useState<Translation>({ locale: TARGET_LOCALES[0], title: '', excerpt: '', content: '', isAutoTranslated: false });

  const [savingEn, setSavingEn] = useState(false);
  const [savingRight, setSavingRight] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [msg, setMsg] = useState('');
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [copied, setCopied] = useState(false);

  // ─── Load bài viết ───
  const load = useCallback(async () => {
    setLoading(true);
    const data: ArticleData = await fetch(`/api/admin/articles/${articleId}`).then(r => r.json());
    setArticle(data);
    setMeta({ slug: data.slug, status: data.status, category: data.category ?? '', coverImage: data.coverImage ?? '' });
    const enTr = data.translations.find(t => t.locale === 'en');
    if (enTr) setEn(enTr);
    setLoading(false);
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  // ─── Đổi locale khung phải → load bản dịch đó ───
  useEffect(() => {
    if (!article) return;
    const tr = article.translations.find(t => t.locale === rightLocale);
    setRight(tr ?? { locale: rightLocale, title: '', excerpt: '', content: '', isAutoTranslated: false });
    setPasteMode(false); setPasteText('');
  }, [rightLocale, article]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // ─── Lưu bản gốc EN ───
  async function saveEn() {
    setSavingEn(true);
    const res = await fetch(`/api/admin/articles/${articleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...meta,
        title: en.title, excerpt: en.excerpt, content: en.content,
      }),
    });
    setSavingEn(false);
    if (res.ok) { flash('✓ Đã lưu bản gốc'); load(); }
    else flash('✗ Lỗi lưu bản gốc');
  }

  // ─── Lưu bản dịch khung phải (đánh dấu đã review vì sửa tay) ───
  async function saveRight() {
    setSavingRight(true);
    const res = await fetch(`/api/admin/articles/${articleId}/translation/${rightLocale}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: right.title, excerpt: right.excerpt, content: right.content,
        markReviewed: true,
      }),
    });
    setSavingRight(false);
    if (res.ok) { flash(`✓ Đã lưu bản ${LOCALE_NAMES[rightLocale]}`); load(); }
    else flash('✗ Lỗi lưu bản dịch');
  }

  // ─── Dịch API tất cả ngôn ngữ ───
  async function translateAll() {
    setTranslating(true); setMsg('Đang dịch tất cả ngôn ngữ...');
    const res = await fetch(`/api/admin/articles/${articleId}/translate`, { method: 'POST' });
    const data = await res.json();
    setTranslating(false);
    // Nếu có locale fail, kèm lỗi THẬT đầu tiên (VD "DeepL 456: …") để chẩn đoán, không giấu
    const firstErr = (data.results ?? []).find((r: { success: boolean; error?: string }) => !r.success && r.error)?.error;
    setMsg(firstErr ? `${data.summary ?? ''} — lỗi: ${firstErr}` : (data.summary ?? 'Xong!'));
    setTimeout(() => setMsg(''), firstErr ? 12000 : 3000);
    await load();
  }

  // ─── Copy khối EN có nhãn để dán vào DeepL ───
  async function copyForDeepL() {
    const block = [MARK.title, en.title, '', MARK.excerpt, en.excerpt, '', MARK.content, en.content].join('\n');
    try { await navigator.clipboard.writeText(block); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  // ─── Parse text đã dán (có nhãn) vào khung phải ───
  function applyPaste() {
    const lines = pasteText.split('\n');
    const marks: number[] = [];
    lines.forEach((l, i) => { if (l.includes('=====')) marks.push(i); });
    if (marks.length < 3) { flash('✗ Bản dán thiếu 3 dòng nhãn ====='); return; }
    const [i1, i2, i3] = marks;
    setRight({
      ...right,
      title: lines.slice(i1 + 1, i2).join('\n').trim(),
      excerpt: lines.slice(i2 + 1, i3).join('\n').trim(),
      content: lines.slice(i3 + 1).join('\n').trim(),
    });
    setPasteMode(false); setPasteText('');
    flash('✓ Đã điền vào khung phải — nhớ bấm Lưu');
  }

  if (loading || !article) return <div className="py-16 text-center text-gray-400">Đang tải...</div>;

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const rightDone = article.translations.some(t => t.locale === rightLocale);
  const rightAuto = article.translations.find(t => t.locale === rightLocale)?.isAutoTranslated;

  return (
    <div className="space-y-4">
      {/* Thanh công cụ trên cùng */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/articles')}
            className="text-sm text-gray-500 hover:text-gray-700">← Danh sách</button>
          <span className="font-mono text-xs text-gray-400">{article.slug}</span>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className="text-xs font-medium text-gray-600">{msg}</span>}
          <button onClick={translateAll} disabled={translating}
            className="text-xs font-semibold px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors">
            {translating ? 'Đang dịch...' : '⚡ Dịch API tất cả'}
          </button>
        </div>
      </div>

      {/* Meta bar: slug, status, category, cover */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Slug</label>
          <input value={meta.slug} onChange={e => setMeta({ ...meta, slug: e.target.value })} className={`${inputCls} font-mono text-xs`} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Trạng thái</label>
          <select value={meta.status} onChange={e => setMeta({ ...meta, status: e.target.value })} className={inputCls}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Danh mục</label>
          <input value={meta.category} onChange={e => setMeta({ ...meta, category: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Ảnh bìa (URL)</label>
          <input value={meta.coverImage} onChange={e => setMeta({ ...meta, coverImage: e.target.value })} placeholder="https://..." className={inputCls} />
        </div>
      </div>

      {/* Split view: trái EN | phải bản dịch */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* ─── KHUNG TRÁI: bản gốc EN ─── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-gray-900 text-white rounded">EN</span>
              <span className="font-semibold text-gray-900 text-sm">Bản gốc (English)</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={copyForDeepL}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                {copied ? '✓ Đã copy' : '📋 Copy cho DeepL'}
              </button>
              <button onClick={saveEn} disabled={savingEn}
                className="text-xs font-semibold px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded transition-colors">
                {savingEn ? '...' : 'Lưu'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Tiêu đề</label>
            <input value={en.title} onChange={e => setEn({ ...en, title: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tóm tắt</label>
            <textarea value={en.excerpt} onChange={e => setEn({ ...en, excerpt: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nội dung (Markdown)</label>
            <textarea value={en.content} onChange={e => setEn({ ...en, content: e.target.value })} rows={22} className={`${inputCls} resize-y font-mono text-xs leading-relaxed`} />
          </div>
        </div>

        {/* ─── KHUNG PHẢI: bản dịch ─── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select value={rightLocale} onChange={e => setRightLocale(e.target.value)}
                className="text-sm font-semibold border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {TARGET_LOCALES.map(l => (
                  <option key={l} value={l}>
                    {LOCALE_NAMES[l]} {article.translations.some(t => t.locale === l) ? '✓' : '○'}
                  </option>
                ))}
              </select>
              {rightDone && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rightAuto ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                  {rightAuto ? 'Auto' : 'Đã review'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPasteMode(!pasteMode)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${pasteMode ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                📥 Dán DeepL
              </button>
              <button onClick={saveRight} disabled={savingRight}
                className="text-xs font-semibold px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded transition-colors">
                {savingRight ? '...' : 'Lưu'}
              </button>
            </div>
          </div>

          {pasteMode ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">
                Dán kết quả DeepL (giữ nguyên 3 dòng <span className="font-mono">=====</span>) rồi bấm Áp dụng:
              </p>
              <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={24}
                placeholder={'===== TITLE =====\n...\n\n===== EXCERPT =====\n...\n\n===== CONTENT =====\n...'}
                className={`${inputCls} resize-y font-mono text-xs`} />
              <div className="flex gap-2">
                <button onClick={applyPaste}
                  className="text-xs font-semibold px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                  Áp dụng vào khung phải
                </button>
                <button onClick={() => { setPasteMode(false); setPasteText(''); }}
                  className="text-xs px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg">
                  Huỷ
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tiêu đề</label>
                <input value={right.title} onChange={e => setRight({ ...right, title: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tóm tắt</label>
                <textarea value={right.excerpt} onChange={e => setRight({ ...right, excerpt: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Nội dung (Markdown)</label>
                <textarea value={right.content} onChange={e => setRight({ ...right, content: e.target.value })} rows={22}
                  placeholder={rightDone ? '' : `Chưa có bản dịch. Dùng "Dịch API" hoặc "Dán DeepL", hoặc gõ trực tiếp.`}
                  className={`${inputCls} resize-y font-mono text-xs leading-relaxed`} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lưới trạng thái toàn bộ ngôn ngữ */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">Tất cả bản dịch</span>
          <span className="text-xs text-gray-400">Tím = auto DeepL · Xanh = đã review · Xám = chưa dịch</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {['en', ...TARGET_LOCALES].map(locale => {
            const done = article.translations.some(t => t.locale === locale);
            const auto = article.translations.find(t => t.locale === locale)?.isAutoTranslated;
            const isCurrent = locale === rightLocale;
            return (
              <button key={locale}
                onClick={() => locale !== 'en' && setRightLocale(locale)}
                disabled={locale === 'en'}
                className={`py-2 px-2 rounded-lg text-xs font-mono font-medium transition-colors ${
                  isCurrent ? 'ring-2 ring-indigo-500 ' : ''
                }${
                  locale === 'en' ? 'bg-gray-900 text-white cursor-default'
                    : done ? (auto ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-green-100 text-green-700 hover:bg-green-200')
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}>
                {locale}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
