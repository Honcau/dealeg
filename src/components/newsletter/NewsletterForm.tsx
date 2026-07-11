'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

// Category/brand quan tâm — để sau segment gửi theo nhóm (map sang Listmonk list/attrib).
const CATEGORY_OPTIONS = [
  { code: 'hosting',  label: 'Hosting' },
  { code: 'vpn',      label: 'VPN' },
  { code: 'domain',   label: 'Domain' },
  { code: 'security', label: 'Security' },
  { code: 'email',    label: 'Email' },
  { code: 'cdn',      label: 'CDN' },
  { code: 'ssl',      label: 'SSL' },
];

interface Props {
  source?: string;
  variant?: 'inline' | 'card';
  /** Hiện lựa chọn tần suất (weekly/daily) — dùng cho card/exit-intent. */
  showFrequency?: boolean;
  /** Hiện chọn category/brand quan tâm — dùng cho card/exit-intent. */
  showCategories?: boolean;
}

export function NewsletterForm({ source = 'unknown', variant = 'card', showFrequency = false, showCategories = false }: Props) {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'daily'>('weekly');
  // Mặc định quan tâm HẾT các category (user bỏ chọn cái không muốn).
  const [categories, setCategories] = useState<string[]>(CATEGORY_OPTIONS.map(c => c.code));
  const toggleCategory = (c: string) =>
    setCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  // Fallback tiếng Anh cho các key mới nếu locale chưa dịch (chỉ en/vi có sẵn).
  const tx = (key: string, fallback: string) => (t.has(key) ? t(key) : fallback);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading'); setMsg('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, source, frequency, categories }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus('success');
        // Double opt-in (Listmonk) → yêu cầu xác nhận email; ngược lại "đã đăng ký".
        setMsg(data?.pending
          ? tx('confirm', 'Almost done! Check your email to confirm your subscription.')
          : t('success'));
        setEmail('');
      } else {
        setStatus('error'); setMsg(t('error'));
      }
    } catch {
      setStatus('error'); setMsg(t('error'));
    }
  }

  if (status === 'success') {
    return (
      <div className={variant === 'card'
        ? 'bg-green-50 border border-green-200 rounded-2xl p-6 text-center'
        : 'bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center'}>
        <p className="text-green-700 font-medium text-sm">✓ {msg}</p>
      </div>
    );
  }

  const inputCls = 'flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const btnCls = 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors';

  const frequencyToggle = showFrequency && (
    <div className="flex items-center gap-3 mt-3 text-sm">
      <span className="text-gray-500">{tx('frequencyLabel', 'Frequency')}:</span>
      {(['weekly', 'daily'] as const).map(f => (
        <label key={f} className="flex items-center gap-1.5 cursor-pointer">
          <input type="radio" name={`freq-${source}`} checked={frequency === f}
            onChange={() => setFrequency(f)} className="accent-indigo-600" />
          <span className={frequency === f ? 'text-gray-900 font-medium' : 'text-gray-500'}>
            {f === 'weekly' ? tx('freqWeekly', 'Weekly') : tx('freqDaily', 'Daily')}
          </span>
        </label>
      ))}
    </div>
  );

  const categoryChips = showCategories && (
    <div className="mt-3">
      <span className="text-sm text-gray-500">{tx('categoriesLabel', 'Interested in')}:</span>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {CATEGORY_OPTIONS.map(c => {
          const on = categories.includes(c.code);
          return (
            <button type="button" key={c.code} onClick={() => toggleCategory(c.code)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                on ? 'bg-indigo-600 border-indigo-600 text-white'
                   : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400'
              }`}>
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex gap-2">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={t('placeholder')} required className={inputCls} />
          <button type="submit" disabled={status === 'loading'} className={btnCls}>
            {status === 'loading' ? '...' : t('subscribe')}
          </button>
        </div>
        {frequencyToggle}
        {msg && status === 'error' && <p className="text-xs text-red-500 mt-1">{msg}</p>}
      </form>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
      <h3 className="font-bold text-gray-900 text-lg mb-1">{t('title')}</h3>
      <p className="text-sm text-gray-600 mb-4">{t('subtitle')}</p>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={t('placeholder')} required className={inputCls} />
          <button type="submit" disabled={status === 'loading'} className={btnCls}>
            {status === 'loading' ? '...' : t('subscribe')}
          </button>
        </div>
        {frequencyToggle}
        {categoryChips}
        {msg && status === 'error' && <p className="text-xs text-red-500 mt-2">{msg}</p>}
        <p className="text-xs text-gray-400 mt-2">{t('privacy')}</p>
      </form>
    </div>
  );
}
