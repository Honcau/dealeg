'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TARGET_LOCALES } from '@/lib/deepl-langs';

const TOTAL_LOCALES = TARGET_LOCALES.length + 1; // +1 for EN

interface Article {
  id: string; slug: string; status: string;
  publishedAt: string | null; createdAt: string;
  translations: { locale: string; title: string; isAutoTranslated: boolean }[];
}

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  DRAFT:     'bg-gray-100 text-gray-600',
  ARCHIVED:  'bg-red-100 text-red-600',
};

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy,     setBusy]     = useState(false);
  const [filter,   setFilter]   = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');

  async function load() {
    setLoading(true);
    const data = await fetch('/api/admin/articles').then(r => r.json());
    setArticles(data);
    setSelected(new Set());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const enTitle = (a: Article) => a.translations.find(t => t.locale === 'en')?.title ?? a.slug;

  const shown = articles.filter(a => filter === 'ALL' || a.status === filter);

  // ─── Chọn ───
  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (selected.size === shown.length) setSelected(new Set());
    else setSelected(new Set(shown.map(a => a.id)));
  }

  // ─── Quick action đơn lẻ: đổi status ───
  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  async function handleDelete(id: string, slug: string) {
    if (!confirm(`Xoá bài "${slug}"?`)) return;
    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    setArticles(prev => prev.filter(a => a.id !== id));
  }

  // ─── Bulk action nhiều bài ───
  async function bulk(action: 'publish' | 'draft' | 'archive' | 'delete') {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    const labels = { publish: 'Đăng', draft: 'Chuyển nháp', archive: 'Lưu trữ', delete: 'Xoá' };
    if (action === 'delete' && !confirm(`Xoá ${ids.length} bài đã chọn? Không thể hoàn tác.`)) return;
    if (action === 'publish' && !confirm(`Đăng ${ids.length} bài đã chọn?`)) return;

    setBusy(true);
    await fetch('/api/admin/articles/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action }),
    });
    setBusy(false);
    await load();
  }

  const allSelected = shown.length > 0 && selected.size === shown.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bài viết</h1>
          <p className="text-sm text-gray-400 mt-0.5">{articles.length} bài · {TOTAL_LOCALES} ngôn ngữ</p>
        </div>
        <Link href="/admin/articles/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          + Bài mới
        </Link>
      </div>

      {/* Filter theo trạng thái */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'DRAFT', 'PUBLISHED'] as const).map(f => {
          const n = f === 'ALL' ? articles.length : articles.filter(a => a.status === f).length;
          return (
            <button key={f} onClick={() => { setFilter(f); setSelected(new Set()); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                filter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f === 'ALL' ? 'Tất cả' : f === 'DRAFT' ? 'Nháp' : 'Đã đăng'} ({n})
            </button>
          );
        })}
      </div>

      {/* Thanh bulk action — hiện khi có bài được chọn */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <span className="text-sm font-medium text-indigo-900">Đã chọn {selected.size} bài:</span>
          <button onClick={() => bulk('publish')} disabled={busy}
            className="text-xs font-semibold px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
            Đăng
          </button>
          <button onClick={() => bulk('draft')} disabled={busy}
            className="text-xs font-semibold px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50">
            Chuyển nháp
          </button>
          <button onClick={() => bulk('archive')} disabled={busy}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg disabled:opacity-50">
            Lưu trữ
          </button>
          <button onClick={() => bulk('delete')} disabled={busy}
            className="text-xs font-semibold px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
            Xoá
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 hover:text-gray-700 ml-auto">
            Bỏ chọn
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                </th>
                {['Tiêu đề','Trạng thái','Đã dịch','Thao tác'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(a => {
                const count = a.translations.length;
                const allDone = count >= TOTAL_LOCALES;
                const isSelected = selected.has(a.id);
                return (
                  <tr key={a.id} className={`border-b border-gray-100 transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(a.id)}
                        className="accent-indigo-600 w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 max-w-[240px] truncate">{enTitle(a)}</div>
                      <div className="font-mono text-xs text-gray-400 mt-0.5">{a.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${allDone ? 'text-green-600' : 'text-amber-600'}`}>
                        {count}/{TOTAL_LOCALES} {allDone ? '✓' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Quick toggle publish/draft */}
                        {a.status === 'PUBLISHED' ? (
                          <button onClick={() => setStatus(a.id, 'DRAFT')}
                            className="text-xs text-gray-600 hover:underline font-medium">↓ Nháp</button>
                        ) : (
                          <button onClick={() => setStatus(a.id, 'PUBLISHED')}
                            className="text-xs text-green-600 hover:underline font-medium">↑ Đăng</button>
                        )}
                        <span className="text-gray-200">|</span>
                        <Link href={`/admin/articles/${a.id}/edit`}
                          className="text-xs text-indigo-600 hover:underline font-medium">Sửa &amp; Dịch</Link>
                        <button onClick={() => handleDelete(a.id, a.slug)}
                          className="text-xs text-red-500 hover:underline font-medium">Xoá</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                  {filter === 'ALL' ? 'Chưa có bài viết nào' : `Không có bài ${filter === 'DRAFT' ? 'nháp' : 'đã đăng'}`}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
