'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CAT_COLOR: Record<string,string> = {
  DOMAIN:   'bg-violet-100 text-violet-700',
  HOSTING:  'bg-blue-100 text-blue-700',
  VPN:      'bg-emerald-100 text-emerald-700',
  CDN:      'bg-sky-100 text-sky-700',
  SECURITY: 'bg-orange-100 text-orange-700',
  EMAIL:    'bg-pink-100 text-pink-700',
  SSL:      'bg-yellow-100 text-yellow-700',
  OTHER:    'bg-gray-100 text-gray-600',
};

interface Voucher {
  id: string; code: string; provider: string; category: string;
  discount: string; discountValue: number; isVerified: boolean;
  isActive: boolean; expiresAt: string | null; useCount: number;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    setLoading(true);
    const res  = await fetch('/api/admin/vouchers');
    const data = await res.json();
    setVouchers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, code: string) {
    if (!confirm(`Xoá voucher "${code}"?`)) return;
    setDeleting(id);
    await fetch(`/api/admin/vouchers/${id}`, { method: 'DELETE' });
    setVouchers(prev => prev.filter(v => v.id !== id));
    setDeleting(null);
  }

  const filtered = vouchers.filter(v =>
    v.code.includes(search.toUpperCase()) ||
    v.provider.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:    vouchers.length,
    active:   vouchers.filter(v => v.isActive).length,
    verified: vouchers.filter(v => v.isVerified).length,
    expired:  vouchers.filter(v => v.expiresAt && new Date(v.expiresAt) < new Date()).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vouchers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} tổng · {stats.active} active · {stats.verified} đã xác minh · {stats.expired} hết hạn
          </p>
        </div>
        <Link href="/admin/vouchers/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Thêm voucher
        </Link>
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Tìm theo mã, provider, category..."
        className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Mã code','Provider','Danh mục','Giảm giá','Hết hạn','Trạng thái','Lượt dùng','Thao tác'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không có voucher nào</td></tr>
              )}
              {filtered.map(v => {
                const expired = v.expiresAt && new Date(v.expiresAt) < new Date();
                return (
                  <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{v.code}</td>
                    <td className="px-4 py-3 text-gray-700">{v.provider}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLOR[v.category] ?? 'bg-gray-100'}`}>
                        {v.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">{v.discount}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {v.expiresAt
                        ? <span className={expired ? 'text-red-500' : ''}>{new Date(v.expiresAt).toLocaleDateString('vi')}</span>
                        : <span className="text-gray-300">Không giới hạn</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {v.isActive ? 'Active' : 'Off'}
                        </span>
                        {v.isVerified && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">✓</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{v.useCount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/vouchers/${v.id}/edit`}
                          className="text-xs text-indigo-600 hover:underline font-medium">Sửa</Link>
                        <button onClick={() => handleDelete(v.id, v.code)}
                          disabled={deleting === v.id}
                          className="text-xs text-red-500 hover:underline font-medium disabled:opacity-40">
                          {deleting === v.id ? '...' : 'Xoá'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
