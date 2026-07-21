'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Voucher } from '@/types/voucher';
import { isExpired, formatDate, formatCount, maskVoucherCode, trackVoucherClick, copyToClipboard, isInAppBrowser } from '@/lib/utils';
import { SaveButton } from './SaveButton';
import { CopiedToast } from './CopiedToast';

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

/** Card chi tiết voucher — phiên bản lớn cho trang /voucher/[id] */
export function VoucherDetailCard({ voucher }: { voucher: Voucher }) {
  const t = useTranslations('voucher');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);      // hiện toast
  const [copyOk, setCopyOk] = useState(true);       // copy thật sự thành công hay không
  const [revealed, setRevealed] = useState(false);
  const expired = isExpired(voucher.expiresAt);

  const targetUrl =
    voucher.affiliateUrl && voucher.affiliateUrl !== '#'
      ? voucher.affiliateUrl
      : voucher.sourceUrl;

  // href KHÔNG trỏ thẳng affiliate: filter adblock (EasyList) ẩn cả element theo href,
  // VD ##[href^="https://www.cloudways.com/en/?id"] → nút "Nhận mã" biến mất với user
  // bật adblock. Trỏ /api/go/<id> (domain mình), server 302 sang affiliate.
  const goUrl = targetUrl ? `/api/go/${voucher.id}` : undefined;

  const displayCode = voucher.hideCode && !revealed ? maskVoucherCode(voucher.code) : voucher.code;

  // Chống popup blocker: dùng <a target="_blank"> gốc (xem chú thích ở VoucherCard),
  // handler chỉ copy + lộ mã đồng bộ, không window.open, không preventDefault.
  const handleGetCode = (e?: React.MouseEvent) => {
    if (expired) return;
    setRevealed(true);

    // Copy đồng bộ ngay trong user-gesture. copyToClipboard có fallback execCommand
    // nên chạy được cả trong in-app browser (Clipboard API ở đó thường bị chặn).
    const ok = copyToClipboard(voucher.code);
    setCopyOk(ok);
    setCopied(true);
    // Toast ở lại đủ lâu để còn thấy khi quay về tab. Đồng thời che lại mã (deal ẩn):
    // lộ đầy đủ trong lúc toast báo "đã copy" cho user kịp xác nhận, rồi cùng ẩn — giữ
    // vẻ độc quyền cho lượt xem sau (mã vẫn nằm trong clipboard).
    setTimeout(() => { setCopied(false); setRevealed(false); }, 6000);

    // Ghi nhận click (tăng useCount) — sendBeacon để không mất khi tab bị nền
    trackVoucherClick(voucher.id);

    // IN-APP BROWSER (mở link từ bot Telegram/Facebook...): webview không có tab nên
    // target="_blank" thường không mở được gì → tap vào là chết lặng. Tự điều hướng
    // ngay trong webview, chờ 1 nhịp cho toast kịp hiện rồi mới đi.
    if (goUrl && e && isInAppBrowser()) {
      e.preventDefault();
      setTimeout(() => { window.location.href = goUrl; }, 600);
    }
  };

  /** Chuột giữa chỉ bắn 'auxclick' — xem chú thích ở VoucherCard. */
  const handleAuxClick = (e: React.MouseEvent) => {
    if (e.button === 1) handleGetCode();
  };

  // Nhãn giảm giá: ưu tiên chuỗi `discount` do admin nhập (VD "Miễn phí 3 tháng").
  // Fallback tính từ discountValue nếu chuỗi trống.
  const discountLabel =
    voucher.discount?.trim() ||
    (voucher.discountType === 'free' ? 'FREE'
      : voucher.discountValue ? `-${voucher.discountValue}%`
      : '');

  return (
    <article className={`bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 ${expired ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-extrabold text-gray-900">{voucher.provider}</h1>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${CATEGORY_COLORS[voucher.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {tNav.has(voucher.category) ? tNav(voucher.category) : voucher.category}
          </span>
          <SaveButton voucherId={voucher.id} size="lg" />
        </div>
      </div>

      {/* Discount lớn */}
      <div className="font-display text-6xl font-bold text-indigo-600 tracking-tight tabular-nums mb-4">
        {discountLabel}
      </div>

      {/* Tiêu đề */}
      {voucher.title && (
        <h2 className="text-xl font-bold text-gray-900 leading-snug mb-3">{voucher.title}</h2>
      )}

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

      {/* Nút nhận mã lớn — <a target="_blank"> để không bị chặn tab */}
      {!expired ? (
        (() => {
          const inner = (
            <>
              <span className="flex-1 min-w-0 flex items-center justify-center font-mono font-bold text-lg tracking-widest text-gray-900 bg-gray-50 px-4 py-4 group-hover:bg-indigo-50 transition-colors">
                <span className="truncate max-w-full">{displayCode}</span>
              </span>
              <span className="relative shrink-0 flex items-center justify-center bg-indigo-600 group-hover:bg-indigo-700 text-white text-base font-semibold px-8 transition-colors whitespace-nowrap border-l-2 border-dashed border-white/50">
                <span aria-hidden className="absolute -left-[8px] -top-[8px] w-4 h-4 rounded-full bg-white border border-gray-200 group-hover:border-indigo-500 transition-colors" />
                <span aria-hidden className="absolute -left-[8px] -bottom-[8px] w-4 h-4 rounded-full bg-white border border-gray-200 group-hover:border-indigo-500 transition-colors" />
                {t('getCode')} →
              </span>
            </>
          );
          const cls = 'group relative w-full flex items-stretch rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 transition-colors cursor-pointer';
          return goUrl ? (
            <a href={goUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={handleGetCode} onAuxClick={handleAuxClick} className={cls}>{inner}</a>
          ) : (
            <button type="button" onClick={handleGetCode} onAuxClick={handleAuxClick} className={cls}>{inner}</button>
          );
        })()
      ) : (
        <div className="w-full px-4 py-4 rounded-xl border-2 border-dashed border-gray-200 text-center">
          <span className="font-mono font-bold text-lg tracking-widest text-gray-400 line-through">
            {displayCode}
          </span>
        </div>
      )}

      {/* Thông báo mỗi lần bấm "Nhận mã" */}
      {copied && (
        <CopiedToast ok={copyOk}
          message={copyOk
            ? t('copiedHint')
            : t('copyFailed')} />
      )}
    </article>
  );
}
