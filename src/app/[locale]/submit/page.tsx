/**
 * TRANG SUBMIT VOUCHER
 * Người dùng gửi deal mới → lưu DB với status PENDING → admin duyệt
 */
'use client';

import { useState } from 'react';

const CATEGORIES = ['DOMAIN','HOSTING','VPN','SECURITY','EMAIL','CDN','SSL','OTHER'];

export default function SubmitPage() {
  const [form, setForm] = useState({
    code: '', provider: '', discount: '', url: '', email: ''
  });
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.code || !form.provider) {
      setStatus('error');
      setMessage('Vui lòng điền Mã voucher và Nhà cung cấp');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/vouchers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
        setForm({ code: '', provider: '', discount: '', url: '', email: '' });
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Có lỗi xảy ra');
      }
    } catch {
      setStatus('error');
      setMessage('Không thể kết nối server');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Gửi deal mới</h1>
      <p className="text-gray-500 text-sm mb-8">
        Bạn biết một voucher chưa có trên Dealeg? Chia sẻ để cộng đồng cùng tiết kiệm!
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">

        {/* Mã voucher */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã voucher <span className="text-red-500">*</span>
          </label>
          <input
            name="code" value={form.code} onChange={handleChange}
            placeholder="Ví dụ: CHEAP2026"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Nhà cung cấp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nhà cung cấp <span className="text-red-500">*</span>
          </label>
          <input
            name="provider" value={form.provider} onChange={handleChange}
            placeholder="Ví dụ: Namecheap, Hostinger..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Mức giảm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mức giảm giá
          </label>
          <input
            name="discount" value={form.discount} onChange={handleChange}
            placeholder="Ví dụ: 30% hoặc $5 off"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link trang áp dụng
          </label>
          <input
            name="url" value={form.url} onChange={handleChange}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Email (tuỳ chọn) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email của bạn <span className="text-gray-400 font-normal">(tuỳ chọn — để nhận thông báo khi được duyệt)</span>
          </label>
          <input
            name="email" value={form.email} onChange={handleChange}
            type="email" placeholder="email@example.com"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Feedback */}
        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
            ✅ {message}
          </div>
        )}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            ❌ {message}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={status === 'loading'}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {status === 'loading' ? 'Đang gửi...' : 'Gửi deal →'}
        </button>
      </div>
    </div>
  );
}
