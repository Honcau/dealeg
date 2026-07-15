'use client';

import { useEffect, useState } from 'react';

interface Submission {
  id: string;
  code: string;
  provider: string;
  discount: string | null;
  description: string | null;
  url: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: { email: string } | null;
}

const STATUS_STYLE: Record<Submission['status'], string> = {
  PENDING:  'bg-amber-50 text-amber-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-gray-100 text-gray-500',
};

export default function SubmissionsPage() {
  const [rows, setRows]       = useState<Submission[]>([]);
  const [filter, setFilter]   = useState<'ALL' | Submission['status']>('ALL');
  const [busy, setBusy]       = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/submissions');
    if (res.ok) setRows(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function setStatus(s: Submission, status: Submission['status']) {
    setBusy(s.id);
    await fetch(`/api/admin/submissions/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
    setBusy(null);
  }

  async function remove(s: Submission) {
    if (!confirm(`Xoá submission "${s.code} — ${s.provider}"?`)) return;
    setBusy(s.id);
    await fetch(`/api/admin/submissions/${s.id}`, { method: 'DELETE' });
    await load();
    setBusy(null);
  }

  /** Link mở form tạo voucher đã điền sẵn code/provider/mô tả */
  function createVoucherHref(s: Submission): string {
    const q = new URLSearchParams();
    q.set('code', s.code);
    q.set('provider', s.provider);
    if (s.description) q.set('description', s.description);
    return `/admin/vouchers/new?${q.toString()}`;
  }

  const shown = filter === 'ALL' ? rows : rows.filter(r => r.status === filter);
  const counts = {
    ALL: rows.length,
    PENDING:  rows.filter(r => r.status === 'PENDING').length,
    APPROVED: rows.filter(r => r.status === 'APPROVED').length,
    REJECTED: rows.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Deal người dùng gửi</h1>
      <p className="text-sm text-gray-400 mb-6">{counts.PENDING} chờ duyệt · {counts.ALL} tổng</p>

      {/* Bộ lọc trạng thái */}
      <div className="flex gap-2 mb-4">
        {(['ALL','PENDING','APPROVED','REJECTED'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
            {f === 'ALL' ? 'Tất cả' : f === 'PENDING' ? 'Chờ duyệt' : f === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Mã</th>
              <th className="text-left px-4 py-2.5 font-medium">Provider</th>
              <th className="text-left px-4 py-2.5 font-medium">Giảm</th>
              <th className="text-left px-4 py-2.5 font-medium">Miêu tả</th>
              <th className="text-left px-4 py-2.5 font-medium">Người gửi</th>
              <th className="text-left px-4 py-2.5 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-2.5 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shown.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 align-top">
                <td className="px-4 py-3 font-mono font-bold text-gray-800 whitespace-nowrap">
                  {s.code}
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer"
                      className="block text-[11px] font-sans font-normal text-indigo-500 hover:underline truncate max-w-[140px]">
                      link ↗
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{s.provider}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{s.discount || '—'}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[260px]">
                  {s.description
                    ? <span className="block whitespace-pre-wrap">{s.description}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {s.user?.email ?? '—'}
                  <span className="block text-gray-300">{new Date(s.createdAt).toLocaleDateString('vi')}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLE[s.status]}`}>
                    {s.status === 'PENDING' ? 'Chờ' : s.status === 'APPROVED' ? 'Duyệt' : 'Từ chối'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2.5 justify-end items-center whitespace-nowrap">
                    <a href={createVoucherHref(s)}
                      className="text-indigo-600 hover:underline text-xs font-medium">+ Voucher</a>
                    {s.status !== 'APPROVED' && (
                      <button disabled={busy === s.id} onClick={() => setStatus(s, 'APPROVED')}
                        className="text-green-600 hover:underline text-xs font-medium disabled:opacity-50">Duyệt</button>
                    )}
                    {s.status !== 'REJECTED' && (
                      <button disabled={busy === s.id} onClick={() => setStatus(s, 'REJECTED')}
                        className="text-amber-600 hover:underline text-xs font-medium disabled:opacity-50">Từ chối</button>
                    )}
                    <button disabled={busy === s.id} onClick={() => remove(s)}
                      className="text-red-500 hover:underline text-xs font-medium disabled:opacity-50">Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Không có submission nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
