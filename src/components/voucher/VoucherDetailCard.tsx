'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Voucher } from '@/types/voucher';
import { isExpired, formatDate, formatCount } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  domain:   'bg-violet-50 text-violet-700',
  hosting:  'bg-blue-50 text-blue-700',
  vpn:      'bg-emerald-50 text-emerald-700',
  security: 'bg-orange-50 text-orange-700',
  software: 'bg-pink-50 text-pink-700',
  cloud:    'bg-sky-50 text-sky-700',
};

/** Card chi tiết voucher — phiên bản lớn cho trang /voucher/[id] */
export function VoucherDetailCard({ voucher }: { voucher: Voucher }) {
  const t = useTranslations('voucher');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);
  const expired = isExpired(voucher.expiresAt);

  const handleGetCode = async () => {
    if (expired) return;
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}

    const targetUrl =
      voucher.affiliateUrl && voucher.affiliateUrl !== '#'
        ? voucher.affiliateUrl
        : voucher.sourceUrl;

    if (targetUrl) {
      fetch(`/api/vouchers/${voucher.id}/click`, { method: 'POST' }).catch(() => {});
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const discountLabel =
    voucher.discountType === 'percentage' ? `-${voucher.discountValue}%`
    : voucher.discountType === 'free'     ? 'FREE'
    : `-${voucher.currency ?? '$'}${voucher.discountValue}`;

  return (
    <article className={`bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 ${expired ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-extrabold text-gray-900">{voucher.provider}</h1>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${CATEGORY_COLORS[voucher.category] ?? 'bg-gray-100 text-gray-600'}`}>
          {voucher.category}
        </span>
      </div>

      {/* Discount lớn */}
      <div className="text-5xl font-black text-indigo-600 tracking-tight mb-4">
        {discountLabel}
      </div>

      {/* Mô tả */}
      <p className="text-gray-600 leading-relaxed mb-6">{voucher.description}</p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
        <span>{t('usedCount', { count: formatCount(voucher.usedCount) })}</span>
        {voucher.isVerified && <span className="text-green-600 font-medium">{t('verified')}</span>}
        {expired ? (
          <span className="text-red-500">{t('expired')}</span>
        ) : voucher.expiresAt ? (
          <span>{t('expires')} {formatDate(voucher.expiresAt, locale)}</span>
        ) : (
          <span>{t('noExpiry')}</span>
        )}
      </div>

      {/* Nút nhận mã lớn */}
      {!expired ? (
        <button
          onClick={handleGetCode}
          className="group w-full flex items-stretch rounded-xl overflow-hidden border-2 border-indigo-200 hover:border-indigo-400 transition-all"
        >
          <span className="flex-1 flex items-center justify-center font-mono font-bold text-lg tracking-widest text-gray-800 bg-white px-4 py-4 group-hover:bg-indigo-50 transition-colors">
            {copied ? <span className="text-green-600">{t('copied')}</span> : voucher.code}
          </span>
          <span className="flex items-center justify-center bg-indigo-600 group-hover:bg-indigo-700 text-white text-base font-semibold px-8 transition-colors whitespace-nowrap">
            {t('getCode')} →
          </span>
        </button>
      ) : (
        <div className="w-full px-4 py-4 rounded-xl border-2 border-dashed border-gray-200 text-center">
          <span className="font-mono font-bold text-lg tracking-widest text-gray-400 line-through">
            {voucher.code}
          </span>
        </div>
      )}

      {copied && (
        <p className="text-sm text-center text-green-600 mt-3">{t('copiedHint')}</p>
      )}
    </article>
  );
}
