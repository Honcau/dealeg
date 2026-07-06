'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Voucher } from '@/types/voucher';
import { SaveButton } from './SaveButton';
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
  const [shareOpen, setShareOpen] = useState(false);
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

  // URL trang chi tiết voucher (cho share)
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/voucher/${voucher.id}`
    : `https://dealeg.com/${locale}/voucher/${voucher.id}`;

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
      {/* Provider + category + save */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-gray-900">{voucher.provider}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[voucher.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {voucher.category}
          </span>
          <SaveButton voucherId={voucher.id} />
        </div>
      </div>

      {/* Discount */}
      <div className="font-display text-4xl font-bold text-indigo-600 tracking-tight tabular-nums">
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
          className="group relative flex items-stretch w-full rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 transition-colors cursor-pointer"
        >
          {/* Bên trái: code (phần cuống vé) */}
          <span className="flex-1 flex items-center justify-center font-mono font-bold text-sm tracking-widest text-gray-900 bg-gray-50 px-4 py-3 group-hover:bg-indigo-50 transition-colors">
            {copied ? (
              <span className="text-green-600">{t('copied')}</span>
            ) : (
              voucher.code
            )}
          </span>
          {/* Bên phải: nút hành động — khía vé + đường đứt như vé xé */}
          <span className="relative flex items-center justify-center bg-indigo-600 group-hover:bg-indigo-700 text-white text-sm font-semibold px-5 transition-colors whitespace-nowrap border-l-2 border-dashed border-white/50">
            <span aria-hidden className="absolute -left-[7px] -top-[7px] w-3.5 h-3.5 rounded-full bg-white border border-gray-200 group-hover:border-indigo-500 transition-colors" />
            <span aria-hidden className="absolute -left-[7px] -bottom-[7px] w-3.5 h-3.5 rounded-full bg-white border border-gray-200 group-hover:border-indigo-500 transition-colors" />
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

      {/* Hàng dưới: link chi tiết + share nhanh */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href={`/voucher/${voucher.id}`}
          className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
        >
          {t('details')} →
        </Link>

        {/* Share nhanh: Facebook, Zalo, Telegram */}
        <div className="flex items-center gap-1.5">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Facebook"
            className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] hover:opacity-80 transition-opacity"
          >f</a>
          <a
            href={`https://zalo.me/share/?u=${encodeURIComponent(shareUrl)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Zalo"
            className="w-6 h-6 rounded-full bg-[#0068FF] text-white flex items-center justify-center text-[8px] font-bold hover:opacity-80 transition-opacity"
          >Z</a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(voucher.provider + ' ' + voucher.code)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Telegram"
            className="w-6 h-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center text-[10px] hover:opacity-80 transition-opacity"
          >t</a>
        </div>
      </div>
    </article>
  );
}
