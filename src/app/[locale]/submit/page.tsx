/**
 * TRANG SUBMIT VOUCHER
 * Người dùng gửi deal mới → lưu DB với status PENDING → admin duyệt
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const CATEGORIES = ['DOMAIN','HOSTING','VPS','VPN','SECURITY','EMAIL','CDN','SSL','AITOOL','OTHER'];

export default function SubmitPage() {
  const t = useTranslations('submit');
  const [form, setForm] = useState({
    code: '', provider: '', description: '', url: '', email: ''
  });
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!form.code || !form.provider) {
      setStatus('error');
      setMessage(t('errRequired'));
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
        setMessage(t('success'));
        setForm({ code: '', provider: '', description: '', url: '', email: '' });
      } else {
        setStatus('error');
        // Server chỉ trả CODE — chuỗi hiển thị luôn lấy từ i18n của client theo locale.
        setMessage(data.code === 'DUPLICATE' ? t('errDuplicate') : t('errGeneric'));
      }
    } catch {
      setStatus('error');
      setMessage(t('errConnect'));
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-gray-500 text-sm mb-8">
        {t('subtitle')}
      </p>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">

        {/* Mã voucher */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('code')} <span className="text-red-500">*</span>
          </label>
          <input
            name="code" value={form.code} onChange={handleChange}
            placeholder={t('codePlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Nhà cung cấp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('provider')} <span className="text-red-500">*</span>
          </label>
          <input
            name="provider" value={form.provider} onChange={handleChange}
            placeholder={t('providerPlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Miêu tả chi tiết (tuỳ chọn) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('description')}
          </label>
          <textarea
            name="description" value={form.description} onChange={handleChange}
            rows={4}
            placeholder={t('descriptionPlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Link (tuỳ chọn) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('url')}{' '}
            <span className="text-gray-400 font-normal">
              {t('optional')}
            </span>
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
            {t('yourEmail')} <span className="text-gray-400 font-normal">{t('emailOptional')}</span>
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
          {status === 'loading' ? t('submitting') : t('submit')}
        </button>
      </div>
    </div>
  );
}
