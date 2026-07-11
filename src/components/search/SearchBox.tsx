'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';

interface ToolHit { href: string; name: string; }
interface VoucherHit { id: string; provider: string; code: string; discount: string; discountValue: number | null; title: string; }
interface ArticleHit { slug: string; title: string; excerpt: string; category: string; }

export function SearchBox({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tools, setTools] = useState<ToolHit[]>([]);
  const [vouchers, setVouchers] = useState<VoucherHit[]>([]);
  const [articles, setArticles] = useState<ArticleHit[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounce: chờ 300ms sau khi ngừng gõ mới gọi API
  useEffect(() => {
    if (q.trim().length < 2) {
      setTools([]); setVouchers([]); setArticles([]); setOpen(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`);
        const data = await res.json();
        setTools(data.tools ?? []);
        setVouchers(data.vouchers ?? []);
        setArticles(data.articles ?? []);
        setOpen(true);
      } catch {}
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, locale]);

  // Đóng dropdown khi bấm ngoài
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  const hasResults = tools.length > 0 || vouchers.length > 0 || articles.length > 0;

  return (
    <div ref={boxRef} className={`relative ${variant === 'desktop' ? 'w-full max-w-xs' : 'w-full'}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => { if (hasResults) setOpen(true); }}
            placeholder={t('placeholder')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>
      </form>

      {/* Dropdown gợi ý */}
      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-400">{t('searching')}</div>
          )}

          {!loading && !hasResults && (
            <div className="px-4 py-3 text-sm text-gray-400">{t('noResults')}</div>
          )}

          {/* Tool hits */}
          {tools.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {t('tools')}
              </div>
              {tools.map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                    className="w-4 h-4 text-gray-400 shrink-0" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                  </svg>
                  <span className="font-medium text-sm text-gray-800 truncate">{tool.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Voucher hits */}
          {vouchers.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {t('vouchers')}
              </div>
              {vouchers.map(v => (
                <Link
                  key={v.id}
                  href={`/voucher/${v.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-800 truncate">{v.provider}</div>
                    <div className="text-xs text-gray-400 truncate">{v.title}</div>
                  </div>
                  <span className="text-indigo-600 font-bold text-sm shrink-0 ml-2">
                    {v.discountValue ? `-${v.discountValue}%` : v.discount}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Article hits */}
          {articles.length > 0 && (
            <div className="border-t border-gray-50">
              <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {t('articles')}
              </div>
              {articles.map(a => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-800 line-clamp-1">{a.title}</div>
                  {a.excerpt && <div className="text-xs text-gray-400 line-clamp-1 mt-0.5">{a.excerpt}</div>}
                </Link>
              ))}
            </div>
          )}

          {/* Xem tất cả kết quả */}
          {hasResults && (
            <button
              onClick={handleSubmit}
              className="w-full px-4 py-3 text-sm text-indigo-600 font-medium hover:bg-indigo-50 border-t border-gray-100 transition-colors text-left"
            >
              {t('viewAll', { query: q })} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
