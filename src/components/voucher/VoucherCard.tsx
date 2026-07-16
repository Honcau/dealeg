'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Voucher } from '@/types/voucher';
import { SaveButton } from './SaveButton';
import { CopiedToast } from './CopiedToast';
import { isExpired, formatDate, formatCount, maskVoucherCode } from '@/lib/utils';

interface VoucherCardProps {
  voucher: Voucher;
}

const CATEGORY_COLORS: Record<string, string> = {
  domain:   'bg-violet-50 text-violet-700',
  hosting:  'bg-blue-50 text-blue-700',
  vps:      'bg-cyan-50 text-cyan-700',
  aitool:   'bg-fuchsia-50 text-fuchsia-700',
  vpn:      'bg-emerald-50 text-emerald-700',
  security: 'bg-orange-50 text-orange-700',
  software: 'bg-pink-50 text-pink-700',
  cloud:    'bg-sky-50 text-sky-700',
};

export function VoucherCard({ voucher }: VoucherCardProps) {
  const t = useTranslations('voucher');
  const tShare = useTranslations('share');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);      // hiện toast "đã copy"
  const [revealed, setRevealed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const expired = isExpired(voucher.expiresAt);

  // Link đích: ưu tiên affiliate, fallback link gốc provider
  const targetUrl =
    voucher.affiliateUrl && voucher.affiliateUrl !== '#'
      ? voucher.affiliateUrl
      : voucher.sourceUrl;

  // Mã hiển thị: nếu deal ẩn mã và chưa lộ → hiện dạng che một phần
  const displayCode = voucher.hideCode && !revealed ? maskVoucherCode(voucher.code) : voucher.code;
  // Mã dùng trong text chia sẻ mạng xã hội: deal ẩn mã thì không phát tán mã đầy đủ
  const shareCode = voucher.hideCode ? maskVoucherCode(voucher.code) : voucher.code;

  /**
   * Bấm "Nhận mã": lộ mã đầy đủ + copy clipboard + (nếu có) mở link affiliate.
   *
   * QUAN TRỌNG — chống popup blocker/extension: KHÔNG dùng window.open (dễ bị chặn,
   * nhất là khi gọi sau await). Thay vào đó nút là thẻ <a target="_blank"> gốc → trình
   * duyệt coi đây là điều hướng do người dùng bấm nên KHÔNG chặn. Handler này chỉ chạy
   * đồng bộ trong cùng cú click (copy + reveal), không preventDefault để tab vẫn tự mở.
   */
  const handleGetCode = () => {
    if (expired) return;
    setRevealed(true);
    // copy đồng bộ trong user-gesture (không await) → giữ quyền clipboard
    navigator.clipboard?.writeText(voucher.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 6000);   // toast ở lại đủ lâu để còn thấy khi quay về tab
    // Ghi nhận click (tăng useCount) — fire-and-forget
    fetch(`/api/vouchers/${voucher.id}/click`, { method: 'POST' }).catch(() => {});
  };

  // URL trang chi tiết voucher (cho share)
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${locale}/voucher/${voucher.id}`
    : `https://dealeg.com/${locale}/voucher/${voucher.id}`;

  // Nhãn giảm giá: ưu tiên chuỗi `discount` do admin nhập (VD "Miễn phí 3 tháng").
  // Fallback tính từ discountValue nếu chuỗi trống.
  const discountLabel =
    voucher.discount?.trim() ||
    (voucher.discountType === 'free' ? 'FREE'
      : voucher.discountValue ? `-${voucher.discountValue}%`
      : '');

  // Cả cuống vé là MỘT nút: trái = mã, phải = "Nhận mã". Nhãn nút không đổi —
  // phản hồi "đã copy" nằm ở toast bên dưới nên chữ "Nhận mã" luôn còn.
  const ticketInner = (
    <>
      <span className="flex-1 min-w-0 flex items-center justify-center font-mono font-bold text-sm tracking-widest text-gray-900 bg-gray-50 px-4 py-3 group-hover:bg-indigo-50 transition-colors">
        <span className="truncate max-w-full">{displayCode}</span>
      </span>
      <span className="relative shrink-0 flex items-center justify-center bg-indigo-600 group-hover:bg-indigo-700 text-white text-sm font-semibold px-5 transition-colors whitespace-nowrap border-l-2 border-dashed border-white/50">
        <span aria-hidden className="absolute -left-[7px] -top-[7px] w-3.5 h-3.5 rounded-full bg-white border border-gray-200 group-hover:border-indigo-500 transition-colors" />
        <span aria-hidden className="absolute -left-[7px] -bottom-[7px] w-3.5 h-3.5 rounded-full bg-white border border-gray-200 group-hover:border-indigo-500 transition-colors" />
        {t('getCode')} →
      </span>
    </>
  );

  const ticketCls = 'group relative flex items-stretch w-full rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 transition-colors cursor-pointer';

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

      {/* Tiêu đề */}
      {voucher.title && (
        <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">
          {voucher.title}
        </h3>
      )}

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

      {/* Code + affiliate — bấm là copy code VÀ mở link affiliate ở tab mới.
          Dùng <a target="_blank"> (khi có link) để trình duyệt không chặn tab như window.open. */}
      {!expired ? (
        targetUrl ? (
          <a href={targetUrl} target="_blank" rel="noopener noreferrer sponsored"
            onClick={handleGetCode} className={ticketCls}>
            {ticketInner}
          </a>
        ) : (
          <button type="button" onClick={handleGetCode} className={ticketCls}>
            {ticketInner}
          </button>
        )
      ) : (
        <div className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-100 text-center">
          <span className="font-mono font-bold text-sm tracking-widest text-gray-400 line-through">
            {displayCode}
          </span>
        </div>
      )}

      {/* Thông báo mỗi lần bấm "Nhận mã". Fixed nên vẫn thấy sau khi quay lại tab dealeg. */}
      {copied && <CopiedToast message={t('copiedHint')} />}

      {/* Hàng dưới: link chi tiết + share nhanh */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href={`/voucher/${voucher.id}`}
          className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
        >
          {t('details')} →
        </Link>

        {/* Share nhanh: Facebook, Telegram, X, copy link */}
        <div className="flex items-center gap-1.5">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Facebook"
            className="w-6 h-6 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.43c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.24h3.32l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/>
            </svg>
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(voucher.provider + ' ' + shareCode)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Telegram"
            className="w-6 h-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
            </svg>
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(voucher.provider + ' ' + shareCode)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="X"
            className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
              <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zM17.6 20.65h2.04L6.49 3.24H4.3z"/>
            </svg>
          </a>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await navigator.clipboard.writeText(shareUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              } catch {}
            }}
            title={tShare('copyLink')}
            className="w-6 h-6 rounded-full bg-gray-600 text-white flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            {linkCopied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-green-300">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
