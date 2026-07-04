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

  /**
   * Bấm "Nhận mã": copy code vào clipboard + mở link affiliate ở tab mới.
   * Đây là mô hình chuẩn của site coupon — user copy code rồi được đưa
   * thẳng sang trang provider (qua link affiliate của mình) để dùng ngay.
   */
  const handleGetCode = async () => {
    if (expired) return;

    // 1. Copy code
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // clipboard fail không chặn việc mở link
    }

    // 2. Mở link ở tab mới — ưu tiên link affiliate, fallback link gốc provider
    const targetUrl =
      voucher.affiliateUrl && voucher.affiliateUrl !== '#'
        ? voucher.affiliateUrl
        : voucher.sourceUrl;

    if (targetUrl) {
      // Ghi nhận click (tăng useCount) — fire-and-forget
      fetch(`/api/vouchers/${voucher.id}/click`, { method: 'POST' }).catch(() => {});
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
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

      {/* Code + affiliate — GỘP: bấm là copy code VÀ mở link affiliate */}
      {!expired ? (
        <button
          type="button"
          onClick={handleGetCode}
          className="group relative flex items-stretch w-full rounded-xl overflow-hidden border-2 border-indigo-200 hover:border-indigo-400 transition-all cursor-pointer"
        >
          {/* Bên trái: hiện code */}
          <span className="flex-1 flex items-center justify-center font-mono font-bold text-sm tracking-widest text-gray-800 bg-white px-4 py-3 group-hover:bg-indigo-50 transition-colors">
            {copied ? (
              <span className="text-green-600">{t('copied')}</span>
            ) : (
              voucher.code
            )}
          </span>
          {/* Bên phải: nút hành động */}
          <span className="flex items-center justify-center bg-indigo-600 group-hover:bg-indigo-700 text-white text-sm font-semibold px-5 transition-colors whitespace-nowrap">
            {t('getCode')} →
          </span>
        </button>
      ) : (
        <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-100 text-center">
          <span className="font-mono font-bold text-sm tracking-widest text-gray-400 line-through">
            {voucher.code}
          </span>
        </div>
      )}

      {/* Ghi chú nhỏ: mã đã được copy */}
      {copied && (
        <p className="text-xs text-center text-green-600 -mt-2">
          {t('copiedHint')}
        </p>
      )}
    </article>
  );
}
