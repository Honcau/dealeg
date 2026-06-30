'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TARGET_LOCALES } from '@/lib/translation';

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

  async function load() {
    setLoading(true);
    const data = await fetch('/api/admin/articles').then(r => r.json());
    setArticles(data);
    setLoading(false);
  }

  async function handleDelete(id: string, slug: string) {
    if (!confirm(`Xoá bài "${slug}"?`)) return;
    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
    setArticles(prev => prev.filter(a => a.id !== id));
  }

  async function handleTranslate(id: string) {
    const btn = document.getElementById(`tr-${id}`);
    if (btn) btn.textContent = 'Đang dịch...';
    const res  = await fetch(`/api/admin/articles/${id}/translate`, { method: 'POST' });
    const data = await res.json();
    alert(data.summary ?? 'Xong!');
    await load();
  }

  useEffect(() => { load(); }, []);

  const enTitle = (a: Article) => a.translations.find(t => t.locale === 'en')?.title ?? a.slug;

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

      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Tiêu đề','Slug','Trạng thái','Đã dịch','Ngày tạo','Thao tác'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {articles.map(a => {
                const count = a.translations.length;
                const allDone = count >= TOTAL_LOCALES;
                return (
                  <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{enTitle(a)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.slug}</td>
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
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(a.createdAt).toLocaleDateString('vi')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/articles/${a.id}/edit`}
                          className="text-xs text-indigo-600 hover:underline font-medium">Sửa</Link>
                        <button id={`tr-${a.id}`} onClick={() => handleTranslate(a.id)}
                          className="text-xs text-purple-600 hover:underline font-medium">Dịch</button>
                        <button onClick={() => handleDelete(a.id, a.slug)}
                          className="text-xs text-red-500 hover:underline font-medium">Xoá</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {articles.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Chưa có bài viết nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
