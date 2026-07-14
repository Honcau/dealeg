'use client';

import { useEffect, useState } from 'react';

const CATEGORIES = ['DOMAIN','HOSTING','VPS','VPN','SECURITY','EMAIL','CDN','SSL','AITOOL','OTHER'] as const;

interface Provider {
  id: string;
  name: string;
  slug: string;
  website: string;
  category: string;
  affiliateId: string | null;
  isActive: boolean;
}

const EMPTY = { name: '', website: '', category: 'HOSTING', affiliateId: '', isActive: true };

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm]           = useState({ ...EMPTY });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [msg, setMsg]             = useState('');

  async function load() {
    const res = await fetch('/api/admin/providers');
    if (res.ok) setProviders(await res.json());
  }
  useEffect(() => { load(); }, []);

  function set(field: keyof typeof form, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleCreate() {
    if (!form.name.trim()) { setError('Nhập tên provider'); return; }
    setLoading(true); setError(''); setMsg('');
    const res = await fetch('/api/admin/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg(`✅ Đã tạo "${form.name}"`);
      setForm({ ...EMPTY });
      await load();
      setTimeout(() => setMsg(''), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.name?.[0] ?? 'Tạo thất bại, thử lại');
    }
    setLoading(false);
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Providers</h1>

      {/* Form tạo provider */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Tạo provider mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tên *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="VD: Namecheap" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Danh mục *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input value={form.website} onChange={e => set('website', e.target.value)}
              placeholder="https://namecheap.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Affiliate ID <span className="text-gray-400">(tùy chọn)</span></label>
            <input value={form.affiliateId} onChange={e => set('affiliateId', e.target.value)}
              placeholder="mã affiliate" className={inputCls} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive}
              onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm text-gray-700">Đang active</span>
          </label>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">❌ {error}</p>}
        {msg   && <p className="text-sm text-green-600 mt-3">{msg}</p>}

        <button onClick={handleCreate} disabled={loading}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
          {loading ? 'Đang tạo...' : '➕ Tạo provider'}
        </button>
      </div>

      {/* Danh sách provider */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Tên</th>
              <th className="text-left px-4 py-2.5 font-medium">Danh mục</th>
              <th className="text-left px-4 py-2.5 font-medium">Website</th>
              <th className="text-left px-4 py-2.5 font-medium">Affiliate</th>
              <th className="text-left px-4 py-2.5 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {providers.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.category}</td>
                <td className="px-4 py-2.5 text-gray-500 truncate max-w-[220px]">{p.website || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.affiliateId || '—'}</td>
                <td className="px-4 py-2.5">
                  {p.isActive
                    ? <span className="text-green-600 text-xs font-medium">Active</span>
                    : <span className="text-gray-400 text-xs">Ẩn</span>}
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Chưa có provider nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
