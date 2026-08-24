'use client';

import { useEffect, useState } from 'react';

interface DeeplKeyDto {
  id: string;
  label: string;
  keyMask: string;
  isFree: boolean;
  isActive: boolean;
  charCount: number | null;
  charLimit: number | null;
  remaining: number | null;
  usageCheckedAt: string | null;
  createdAt: string;
}

const EMPTY = { label: '', key: '' };

/** Thanh credit + số ký tự đã dùng / hạn mức */
function CreditBar({ k }: { k: DeeplKeyDto }) {
  if (k.charLimit == null) return <span className="text-xs text-gray-400">chưa kiểm tra</span>;
  const pct = k.charLimit > 0 ? Math.min(100, Math.round((k.charCount ?? 0) / k.charLimit * 100)) : 0;
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="min-w-[160px]">
      <div className="text-xs text-gray-600 mb-1">
        {(k.charCount ?? 0).toLocaleString()} / {k.charLimit.toLocaleString()}
        <span className="text-gray-400"> ({pct}%)</span>
        {k.remaining != null && <span className="text-gray-400"> · còn {k.remaining.toLocaleString()}</span>}
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DeeplPage() {
  const [keys, setKeys]       = useState<DeeplKeyDto[]>([]);
  const [form, setForm]       = useState({ ...EMPTY });
  const [editingId, setEdit]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setCheck]  = useState<string | null>(null);  // id đang check, hoặc 'all'
  const [error, setError]     = useState('');
  const [msg, setMsg]         = useState('');

  async function load() {
    const res = await fetch('/api/admin/deepl');
    if (res.ok) setKeys(await res.json());
  }
  useEffect(() => { load(); }, []);

  function resetForm() { setForm({ ...EMPTY }); setEdit(null); setError(''); }

  function startEdit(k: DeeplKeyDto) {
    setForm({ label: k.label, key: '' });   // key để trống = giữ key cũ
    setEdit(k.id);
    setError(''); setMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit() {
    if (!form.label.trim()) { setError('Nhập tên gợi nhớ'); return; }
    if (!editingId && !form.key.trim()) { setError('Dán DeepL key'); return; }
    setLoading(true); setError(''); setMsg('');

    const url    = editingId ? `/api/admin/deepl/${editingId}` : '/api/admin/deepl';
    const method = editingId ? 'PATCH' : 'POST';
    // Khi sửa mà không nhập key mới → chỉ gửi label
    const body: Record<string, string> = { label: form.label.trim() };
    if (form.key.trim()) body.key = form.key.trim();

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      setMsg(editingId ? `✅ Đã cập nhật "${form.label}"` : `✅ Đã thêm "${form.label}"`);
      resetForm();
      await load();
      setTimeout(() => setMsg(''), 2500);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === 'string' ? d.error : 'Thất bại — kiểm tra lại key');
    }
    setLoading(false);
  }

  async function toggleActive(k: DeeplKeyDto) {
    await fetch(`/api/admin/deepl/${k.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !k.isActive }),
    });
    await load();
  }

  async function handleDelete(k: DeeplKeyDto) {
    if (!confirm(`Xoá DeepL key "${k.label}" (${k.keyMask})?`)) return;
    await fetch(`/api/admin/deepl/${k.id}`, { method: 'DELETE' });
    if (editingId === k.id) resetForm();
    await load();
  }

  async function checkOne(k: DeeplKeyDto) {
    setCheck(k.id);
    const res = await fetch(`/api/admin/deepl/${k.id}/usage`, { method: 'POST' });
    if (res.ok) {
      const d = await res.json();
      if (!d.ok) setMsg(`⚠️ Không lấy được credit của "${k.label}" — key có thể sai/hết hạn`);
      else setTimeout(() => setMsg(''), 2000);
    }
    await load();
    setCheck(null);
  }

  async function checkAll() {
    setCheck('all'); setMsg('');
    await fetch('/api/admin/deepl/usage', { method: 'POST' });
    await load();
    setCheck(null);
    setMsg('✅ Đã kiểm tra credit tất cả key');
    setTimeout(() => setMsg(''), 2000);
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">DeepL keys</h1>
        <button onClick={checkAll} disabled={checking === 'all' || keys.length === 0}
          className="bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors">
          {checking === 'all' ? 'Đang kiểm tra…' : '🔄 Kiểm tra tất cả credit'}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Gộp nhiều key (free 500k ký tự/tháng mỗi key). Khi dịch, hệ thống tự chọn key còn nhiều quota nhất;
        key nào hết (lỗi 456) sẽ tự chuyển sang key khác.
      </p>

      {/* Form thêm / sửa */}
      <div className={`bg-white rounded-xl border p-6 mb-8 ${editingId ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'}`}>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {editingId ? 'Sửa key' : 'Thêm key'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Tên gợi nhớ *</label>
            <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              placeholder="VD: free-1, acc gmail 2" className={inputCls} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>
              DeepL API key {editingId ? <span className="text-gray-400">(để trống = giữ key cũ)</span> : '*'}
            </label>
            <input value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))}
              placeholder="xxxxxxxx-xxxx-…-xxxx:fx (free) hoặc key Pro" className={`${inputCls} font-mono`} />
            <p className="text-xs text-gray-400 mt-1">Đuôi <code className="font-mono">:fx</code> = Free API. Thêm/sửa xong sẽ tự kiểm tra credit.</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mt-3">❌ {error}</p>}
        {msg   && <p className="text-sm text-green-600 mt-3">{msg}</p>}

        <div className="flex gap-3 mt-4">
          <button onClick={handleSubmit} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {loading ? 'Đang lưu…' : editingId ? '💾 Cập nhật' : '➕ Thêm key'}
          </button>
          {editingId && (
            <button onClick={resetForm}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
              Huỷ sửa
            </button>
          )}
        </div>
      </div>

      {/* Danh sách key */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Tên</th>
              <th className="text-left px-4 py-2.5 font-medium">Key</th>
              <th className="text-left px-4 py-2.5 font-medium">Loại</th>
              <th className="text-left px-4 py-2.5 font-medium">Credit (đã dùng / hạn mức)</th>
              <th className="text-left px-4 py-2.5 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-2.5 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keys.map(k => (
              <tr key={k.id} className={editingId === k.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-2.5 font-medium text-gray-800">{k.label}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{k.keyMask}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${k.isFree ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                    {k.isFree ? 'Free' : 'Pro'}
                  </span>
                </td>
                <td className="px-4 py-2.5"><CreditBar k={k} /></td>
                <td className="px-4 py-2.5">
                  {k.isActive
                    ? <span className="text-green-600 text-xs font-medium">Active</span>
                    : <span className="text-gray-400 text-xs">Tắt</span>}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => checkOne(k)} disabled={checking === k.id}
                      className="text-gray-600 hover:underline text-xs font-medium disabled:opacity-50">
                      {checking === k.id ? '…' : 'Kiểm tra'}
                    </button>
                    <button onClick={() => startEdit(k)}
                      className="text-indigo-600 hover:underline text-xs font-medium">Sửa</button>
                    <button onClick={() => toggleActive(k)}
                      className="text-amber-600 hover:underline text-xs font-medium">
                      {k.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button onClick={() => handleDelete(k)}
                      className="text-red-500 hover:underline text-xs font-medium">Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Chưa có key nào — thêm key đầu tiên ở trên.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
