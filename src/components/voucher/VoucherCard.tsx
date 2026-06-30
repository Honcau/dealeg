'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Voucher } from '@/types/voucher';
import { isExpired, formatDate, formatCount } from '@/lib/utils';

interface VoucherCardProps {
  voucher: Voucher;
}

const CATEGORY_COLORS: Record<string, string> = {
  domain:   'bg-violet-50 text-violet-700',
  hosting:  'bg-blue-50 text-blue-700',
  vpn:      'bg-emerald-50 text-emerald-700',
  security: 'bg-orange-50 text-orange-700',
  software: 'bg-pink-50 text-pink-700',
  cloud:    'bg-sky-50 text-sky-700',
};

export function VoucherCard({ voucher }: VoucherCardProps) {
  const t = useTranslations('voucher');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const expired = isExpired(voucher.expiresAt);

  const handleCopy = async () => {
    if (expired) return;
    await navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const discountLabel =
    voucher.discountType === 'percentage' ? `-${voucher.discountValue}%`
    : voucher.discountType === 'free'     ? 'FREE'
    : `-${voucher.currency ?? '$'}${voucher.discountValue}`;

  return (
    <article
      className={`bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${
        expired ? 'opacity-55' : ''
      }`}
    >
      {/* Provider + category */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-gray-900">{voucher.provider}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[voucher.category] ?? 'bg-gray-100 text-gray-600'}`}>
          {voucher.category}
        </span>
      </div>

      {/* Discount */}
      <div className="text-3xl font-black text-indigo-600 tracking-tight">
        {discountLabel}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 line-clamp-2">{voucher.description}</p>

      {/* Code row */}
      <button
        type="button"
        onClick={handleCopy}
        disabled={expired}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all select-none ${
          expired
            ? 'border-gray-100 cursor-not-allowed'
            : copied
            ? 'border-green-400 bg-green-50'
            : 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
        }`}
        aria-label={`${t('copy')} ${voucher.code}`}
      >
        <span className="font-mono font-bold text-sm tracking-widest text-gray-800">
          {voucher.code}
        </span>
        <span className={`text-xs font-semibold transition-colors ${copied ? 'text-green-600' : 'text-indigo-500'}`}>
          {copied ? t('copied') : t('copy')}
        </span>
      </button>

      {/* Meta row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{t('usedCount', { count: formatCount(voucher.usedCount) })}</span>
        <div className="flex items-center gap-1.5">
          {voucher.isVerified && (
            <span className="text-green-500 font-medium">{t('verified')}</span>
          )}
          {expired ? (
            <span className="text-red-400">{t('expired')}</span>
          ) : voucher.expiresAt ? (
            <span>{t('expires')} {formatDate(voucher.expiresAt, locale)}</span>
          ) : (
            <span>{t('noExpiry')}</span>
          )}
        </div>
      </div>

      {/* CTA */}
      {!expired && (
        <a
          href={voucher.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block text-center bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold py-2.5 rounded-xl transition-all"
        >
          {t('getDiscount')} →
        </a>
      )}
    </article>
  );
}
