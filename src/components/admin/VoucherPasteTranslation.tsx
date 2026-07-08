'use client';

import { useState, useEffect, useCallback } from 'react';

const TARGET_LOCALES = ['vi', 'zh', 'hi', 'es', 'pt', 'fr', 'de', 'ar', 'ru', 'ja', 'ko'];
const LOCALE_NAMES: Record<string, string> = {
  vi: 'Tiếng Việt', zh: '中文', hi: 'हिन्दी', es: 'Español', pt: 'Português',
  fr: 'Français', de: 'Deutsch', ar: 'العربية', ru: 'Русский', ja: '日本語', ko: '한국어',
};

export function VoucherPasteTranslation({ voucherId }: { voucherId: string }) {
  const [block, setBlock] = useState('');
  const [existing, setExisting] = useState<string[]>([]);
  const [locale, setLocale] = useState(TARGET_LOCALES[0]);
  const [pasteText, setPasteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/vouchers/${voucherId}/paste-translation`);
    const data = await res.json();
    if (res.ok) {
      setBlock(data.block ?? '');
      setExisting(data.existingLocales ?? []);
      setLoaded(true);
    } else {
      setMsg(data.error ?? 'Chưa có bản tiếng Anh — hãy lưu voucher với mô tả EN trước');
    }
  }, [voucherId]);

  useEffect(() => { load(); }, [load]);

  // Draft tự lưu theo localStorage (khôi phục khi đổi locale)
  useEffect(() => {
    const key = `voucher_draft_${voucherId}_${locale}`;
    const saved = localStorage.getItem(key);
    setPasteText(saved ?? '');
  }, [locale, voucherId]);

  useEffect(() => {
    const key = `voucher_draft_${voucherId}_${locale}`;
    const t = setTimeout(() => {
      if (pasteText) localStorage.setItem(key, pasteText);
    }, 400);
    return () => clearTimeout(t);
  }, [pasteText, locale, voucherId]);

  async function copyBlock() {
    try { await navigator.clipboard.writeText(block); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  async function save() {
    if (!pasteText.includes('=====')) { flash('✗ Bản dán thiếu dòng nhãn ====='); return; }
    setSaving(true);
    const res = await fetch(`/api/admin/vouchers/${voucherId}/paste-translation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale, text: pasteText }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      localStorage.removeItem(`voucher_draft_${voucherId}_${locale}`);
      setPasteText('');
      setExisting(prev => prev.includes(locale) ? prev : [...prev, locale]);
      flash(`✓ Đã lưu ${LOCALE_NAMES[locale]}`);
      // Tự nhảy sang ngôn ngữ chưa dịch tiếp theo
      const next = TARGET_LOCALES.find(l => l !== locale && !existing.includes(l) && l !== locale);
      if (next) setLocale(next);
    } else {
      flash('✗ ' + (data.error ?? 'Lỗi lưu'));
    }
  }

  if (!loaded) {
    return <p className="text-sm text-gray-400">{msg || 'Đang tải...'}</p>;
  }

  const doneCount = existing.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Dịch miễn phí qua DeepL web: copy khối EN → dán vào DeepL → chọn ngôn ngữ → copy kết quả về đây.
        </p>
        <span className={`text-xs font-semibold ${doneCount >= 11 ? 'text-green-600' : 'text-amber-600'}`}>
          {doneCount}/11
        </span>
      </div>

      {/* Khối EN để copy */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Bản tiếng Anh (copy nguyên khối)</span>
          <button onClick={copyBlock}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {copied ? '✓ Đã copy' : '📋 Copy'}
          </button>
        </div>
        <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-32 overflow-auto">{block}</pre>
      </div>

      {/* Chọn ngôn ngữ + dán */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={locale} onChange={e => setLocale(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {TARGET_LOCALES.map(l => (
            <option key={l} value={l}>{LOCALE_NAMES[l]} {existing.includes(l) ? '✓' : '○'}</option>
          ))}
        </select>
        {msg && <span className="text-xs font-medium text-gray-600">{msg}</span>}
      </div>

      <div>
        <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={7}
          placeholder={'Dán kết quả DeepL vào đây (giữ nguyên 2 dòng =====):\n\n===== TITLE =====\n...\n\n===== DESCRIPTION =====\n...'}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
      </div>

      <button onClick={save} disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
        {saving ? 'Đang lưu...' : `Lưu bản ${LOCALE_NAMES[locale]}`}
      </button>

      {/* Lưới trạng thái ngôn ngữ */}
      <div className="grid grid-cols-6 gap-1.5 pt-2">
        {TARGET_LOCALES.map(l => {
          const done = existing.includes(l);
          const cur = l === locale;
          return (
            <button key={l} onClick={() => setLocale(l)}
              className={`py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                cur ? 'ring-2 ring-indigo-500 ' : ''
              }${done ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
