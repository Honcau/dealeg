'use client';

import { useEffect, useState } from 'react';

const CATEGORIES = ['DOMAIN','HOSTING','VPS','VPN','SECURITY','EMAIL','CDN','SSL','AITOOL','OTHER'] as const;

interface Provider {
  id: string;
  name: string;
  slug: string;
  website: string;
  category: string | null;      // danh mục chính (tương thích cũ)
  categories: string[];         // nhiều danh mục
  affiliateId: string | null;
  description: string | null;
  isActive: boolean;
}

const EMPTY = { name: '', website: '', categories: [] as string[], affiliateId: '', description: '', isActive: true };

/** categories mới, fallback về category cũ nếu provider chưa có mảng */
function catsOf(p: Provider): string[] {
  return p.categories?.length ? p.categories : (p.category ? [p.category] : []);
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm]           = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
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

  function toggleCategory(c: string) {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(c)
        ? prev.categories.filter(x => x !== c)
        : [...prev.categories, c],
    }));
  }

  function resetForm() { setForm({ ...EMPTY }); setEditingId(null); setError(''); }

  function startEdit(p: Provider) {
    setForm({
      name:        p.name,
      website:     p.website || '',
      categories:  catsOf(p),
      affiliateId: p.affiliateId || '',
      description: p.description || '',
      isActive:    p.isActive,
    });
    setEditingId(p.id);
    setError(''); setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Nhập tên provider'); return; }
    setLoading(true); setError(''); setMsg('');
    const url    = editingId ? `/api/admin/providers/${editingId}` : '/api/admin/providers';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg(editingId ? `✅ Đã cập nhật "${form.name}"` : `✅ Đã tạo "${form.name}"`);
      resetForm();
      await load();
      setTimeout(() => setMsg(''), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.name?.[0] ?? 'Thất bại, thử lại');
    }
    setLoading(false);
  }

  async function toggleActive(p: Provider) {
    await fetch(`/api/admin/providers/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    await load();
  }

  async function handleDelete(p: Provider) {
    if (!confirm(`Xoá provider "${p.name}"?\nVoucher đang gán tên này sẽ không còn trang provider riêng. Muốn giữ lại thì dùng "Ẩn".`)) return;
    await fetch(`/api/admin/providers/${p.id}`, { method: 'DELETE' });
    if (editingId === p.id) resetForm();
    await load();
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Providers</h1>

      {/* Form tạo / sửa provider */}
      <div className={`bg-white rounded-xl border p-6 mb-8 ${editingId ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'}`}>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {editingId ? 'Sửa provider' : 'Tạo provider mới'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Tên *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="VD: Namecheap" className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>
              Danh mục <span className="text-gray-400">(chọn 1 hoặc nhiều — 1 provider có thể nhiều danh mục; có thể để trống)</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map(c => {
                const on = form.categories.includes(c);
                return (
                  <button type="button" key={c} onClick={() => toggleCategory(c)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${on
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
                    {c}
                  </button>
                );
              })}
            </div>
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
          <div className="md:col-span-2">
            <label className={labelCls}>
              Giới thiệu chung <span className="text-gray-400">(hiển thị trên trang provider)</span>
            </label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Vài dòng giới thiệu về provider này..." className={`${inputCls} resize-none`} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={form.isActive}
              onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm text-gray-700">Đang active</span>
          </label>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">❌ {error}</p>}
        {msg   && <p className="text-sm text-green-600 mt-3">{msg}</p>}

        <div className="flex gap-3 mt-4">
          <button onClick={handleSubmit} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {loading ? 'Đang lưu...' : editingId ? '💾 Cập nhật' : '➕ Tạo provider'}
          </button>
          {editingId && (
            <button onClick={resetForm}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
              Huỷ sửa
            </button>
          )}
        </div>
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
              <th className="text-right px-4 py-2.5 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {providers.map(p => (
              <tr key={p.id} className={editingId === p.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{catsOf(p).join(', ') || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500 truncate max-w-[200px]">{p.website || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.affiliateId || '—'}</td>
                <td className="px-4 py-2.5">
                  {p.isActive
                    ? <span className="text-green-600 text-xs font-medium">Active</span>
                    : <span className="text-gray-400 text-xs">Ẩn</span>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => startEdit(p)}
                      className="text-indigo-600 hover:underline text-xs font-medium">Sửa</button>
                    <button onClick={() => toggleActive(p)}
                      className="text-amber-600 hover:underline text-xs font-medium">
                      {p.isActive ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button onClick={() => handleDelete(p)}
                      className="text-red-500 hover:underline text-xs font-medium">Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Chưa có provider nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
