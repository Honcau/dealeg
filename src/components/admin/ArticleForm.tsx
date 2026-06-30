'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TARGET_LOCALES } from '@/lib/translation';

export interface ArticleFormData {
  slug:        string;
  status:      'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category:    string;
  coverImage:  string;
  title:       string;
  excerpt:     string;
  content:     string;
}

const EMPTY: ArticleFormData = {
  slug: '', status: 'DRAFT', category: '', coverImage: '',
  title: '', excerpt: '', content: '',
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface Props {
  initial?:   Partial<ArticleFormData>;
  articleId?: string;
  translations?: { locale: string; isAutoTranslated: boolean }[];
}

export function ArticleForm({ initial, articleId, translations = [] }: Props) {
  const [form,        setForm]        = useState<ArticleFormData>({ ...EMPTY, ...initial });
  const [loading,     setLoading]     = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error,       setError]       = useState('');
  const [trResults,   setTrResults]   = useState<{ locale: string; success: boolean }[]>([]);
  const router = useRouter();

  function set<K extends keyof ArticleFormData>(k: K, v: ArticleFormData[K]) {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'title' && !articleId) next.slug = slugify(v as string);
      return next;
    });
  }

  async function handleSave() {
    setLoading(true); setError('');
    const url    = articleId ? `/api/admin/articles/${articleId}` : '/api/admin/articles';
    const method = articleId ? 'PUT' : 'POST';
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/admin/articles');
      router.refresh();
    } else {
      setError(JSON.stringify(data.error));
      setLoading(false);
    }
  }

  async function handleTranslate() {
    if (!articleId) return;
    setTranslating(true); setTrResults([]);
    const res  = await fetch(`/api/admin/articles/${articleId}/translate`, { method: 'POST' });
    const data = await res.json();
    setTrResults(data.results ?? []);
    setTranslating(false);
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const lbl      = (t: string, sub?: string) => (
    <div className="mb-1">
      <span className="text-sm font-medium text-gray-700">{t}</span>
      {sub && <span className="text-xs text-gray-400 ml-1">{sub}</span>}
    </div>
  );

  const trCount = translations.length;
  const total   = TARGET_LOCALES.length + 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-5">
        <div>
          {lbl('Tiêu đề (tiếng Anh) *')}
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Tiêu đề bài viết" className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            {lbl('Slug *', '(tự động từ tiêu đề)')}
            <input value={form.slug} onChange={e => set('slug', e.target.value)}
              placeholder="ten-bai-viet" className={`${inputCls} font-mono`} />
          </div>
          <div>
            {lbl('Danh mục')}
            <input value={form.category} onChange={e => set('category', e.target.value)}
              placeholder="domain, hosting, vpn..." className={inputCls} />
          </div>
        </div>

        <div>
          {lbl('Tóm tắt', '(hiện trên listing, ~2 câu)')}
          <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)}
            rows={2} className={`${inputCls} resize-none`}
            placeholder="Tóm tắt ngắn về bài viết..." />
        </div>

        <div>
          {lbl('Nội dung (Markdown) *')}
          <textarea value={form.content} onChange={e => set('content', e.target.value)}
            rows={16} className={`${inputCls} resize-y font-mono text-xs`}
            placeholder={'# Tiêu đề\n\nNội dung bài viết...\n\n## Mục 2\n\n...'} />
          <p className="text-xs text-gray-400 mt-1">
            Hỗ trợ Markdown: **bold**, *italic*, `code`, ## heading, - list
          </p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        {/* Publish settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <p className="font-semibold text-gray-900 text-sm">Xuất bản</p>
          <div>
            {lbl('Trạng thái')}
            <select value={form.status} onChange={e => set('status', e.target.value as 'DRAFT')}
              className={inputCls}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <div>
            {lbl('Ảnh bìa (URL)')}
            <input value={form.coverImage} onChange={e => set('coverImage', e.target.value)}
              placeholder="https://..." className={inputCls} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={handleSave} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
            {loading ? 'Đang lưu...' : articleId ? 'Cập nhật' : 'Tạo bài viết'}
          </button>
        </div>

        {/* Translation panel (only when editing existing) */}
        {articleId && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900 text-sm">Bản dịch</p>
              <span className={`text-xs font-semibold ${trCount >= total ? 'text-green-600' : 'text-amber-600'}`}>
                {trCount}/{total}
              </span>
            </div>

            {/* Locale status grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {['en', ...TARGET_LOCALES].map(locale => {
                const done = translations.some(t => t.locale === locale);
                const auto = translations.find(t => t.locale === locale)?.isAutoTranslated;
                return (
                  <div key={locale}
                    className={`text-center py-1 px-2 rounded text-xs font-mono font-medium ${
                      done
                        ? auto ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    title={done ? (auto ? 'Auto-translated' : 'Human-reviewed') : 'Chưa dịch'}
                  >
                    {locale}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-400">
              Tím = auto DeepL · Xanh = đã review
            </p>

            <button onClick={handleTranslate} disabled={translating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
              {translating ? 'Đang dịch (~15 giây)...' : 'Dịch tất cả ngôn ngữ'}
            </button>

            {/* Translation results */}
            {trResults.length > 0 && (
              <div className="text-xs space-y-0.5">
                {trResults.map(r => (
                  <div key={r.locale} className={r.success ? 'text-green-600' : 'text-red-500'}>
                    {r.success ? '✓' : '✗'} {r.locale}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
