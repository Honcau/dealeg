'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface Props {
  source?: string;
  variant?: 'inline' | 'card';
}

export function NewsletterForm({ source = 'unknown', variant = 'card' }: Props) {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading'); setMsg('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, source }),
      });
      if (res.ok) {
        setStatus('success'); setMsg(t('success')); setEmail('');
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
        {msg && status === 'error' && <p className="text-xs text-red-500 mt-1">{msg}</p>}
      </form>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
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
        {msg && status === 'error' && <p className="text-xs text-red-500 mt-2">{msg}</p>}
        <p className="text-xs text-gray-400 mt-2">{t('privacy')}</p>
      </form>
    </div>
  );
}
