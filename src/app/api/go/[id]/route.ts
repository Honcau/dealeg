import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/go/[id] — redirect sang link affiliate của voucher.
 *
 * Vì sao không để href trỏ thẳng affiliate: các filter chặn quảng cáo (EasyList —
 * lõi của uBlock/ABP/AdGuard/Brave/Cốc Cốc) có rule ẨN CẢ ELEMENT theo href, VD
 * `##[href^="https://www.cloudways.com/en/?id"]` — trúng ngay nút "Nhận mã" của
 * voucher Cloudways: user bật adblock không thấy nút luôn. Trỏ href về domain mình
 * rồi 302 ở server thì filter hết khớp, mọi provider đều miễn nhiễm.
 *
 * /api/* đã nằm ngoài middleware i18n và đã bị robots.ts disallow.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const voucher = await prisma.voucher.findUnique({
    where: { id },
    select: { affiliateUrl: true, sourceUrl: true },
  }).catch(() => null);

  // Cùng thứ tự ưu tiên với VoucherCard: affiliate trước, link gốc sau
  const target =
    voucher?.affiliateUrl && voucher.affiliateUrl !== '#'
      ? voucher.affiliateUrl
      : voucher?.sourceUrl;

  // Chỉ redirect http(s) hợp lệ; voucher không tồn tại / URL hỏng → về trang chủ
  let dest: URL | null = null;
  if (target) {
    try {
      const u = new URL(target);
      if (u.protocol === 'https:' || u.protocol === 'http:') dest = u;
    } catch { /* URL hỏng → dest = null */ }
  }

  const res = NextResponse.redirect(dest ?? new URL('/', req.url), 302);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
