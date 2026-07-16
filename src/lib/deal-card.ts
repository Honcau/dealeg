import { maskVoucherCode } from '@/lib/utils';

/** Deal card mà internal API trả cho bot — đã localize sẵn theo locale của user. */
export interface DealCard {
  id:            string;
  provider:      string;
  category:      string;
  code:          string;   // đã mask nếu là deal ẩn mã
  hideCode:      boolean;
  title:         string;
  description:   string;
  discount:      string;   // nhãn hiển thị: "-30%", "Miễn phí 3 tháng"...
  discountValue: number;
  isVerified:    boolean;
  expiresAt:     string | null;
  url:           string;   // LUÔN trỏ về dealeg.com, không bao giờ là link affiliate
  createdAt:     string;
}

/** Voucher + translations lấy từ Prisma (chỉ cần các field dưới đây). */
type VoucherRow = {
  id: string; provider: string; category: string; code: string; hideCode: boolean;
  discount: string; discountValue: number | null; isVerified: boolean;
  expiresAt: Date | null; createdAt: Date;
  translations: { locale: string; title: string; description: string }[];
};

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dealeg.com').replace(/\/+$/, '');
}

/**
 * Map Voucher → DealCard cho 1 locale.
 *
 * Hai ràng buộc quan trọng (theo nghiên cứu):
 * 1. `url` luôn là trang deal trên dealeg.com — KHÔNG đưa link affiliate thẳng vào tin nhắn
 *    (Amazon Associates chỉ cho phép Special Link tới người đã opt-in; route qua site là cách an toàn).
 * 2. Deal ẩn mã (hideCode) chỉ trả mã đã mask — bot không bao giờ phát tán mã độc quyền.
 */
export function toDealCard(v: VoucherRow, locale: string): DealCard {
  const tr =
    v.translations.find(t => t.locale === locale) ??
    v.translations.find(t => t.locale === 'en');

  const discount = v.discount?.trim() || (v.discountValue ? `-${v.discountValue}%` : '');

  return {
    id:            v.id,
    provider:      v.provider,
    category:      v.category.toLowerCase(),
    code:          v.hideCode ? maskVoucherCode(v.code) : v.code,
    hideCode:      v.hideCode,
    title:         tr?.title ?? '',
    description:   tr?.description ?? '',
    discount,
    discountValue: v.discountValue ?? 0,
    isVerified:    v.isVerified,
    expiresAt:     v.expiresAt ? v.expiresAt.toISOString() : null,
    url:           `${siteUrl()}/${locale}/voucher/${v.id}`,
    createdAt:     v.createdAt.toISOString(),
  };
}
