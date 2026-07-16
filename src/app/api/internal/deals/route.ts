import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/db';
import { checkInternalAuth }         from '@/lib/internal-auth';
import { toDealCard }                from '@/lib/deal-card';

export const dynamic = 'force-dynamic';

/**
 * GET /api/internal/deals?locale=de&categories=hosting,vpn&since=<ISO>&limit=20
 * Header: Authorization: Bearer <INTERNAL_API_TOKEN>
 *
 * Nguồn deal đã localize cho bot. Chỉ trả voucher đang active & chưa hết hạn.
 */
export async function GET(req: NextRequest) {
  if (!checkInternalAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp         = req.nextUrl.searchParams;
  const locale     = sp.get('locale') || 'en';
  const since      = sp.get('since');
  const limit      = Math.min(Number(sp.get('limit') ?? 20) || 20, 50);
  const categories = (sp.get('categories') ?? '')
    .split(',').map(c => c.trim().toUpperCase()).filter(Boolean);

  const sinceDate = since ? new Date(since) : null;
  if (sinceDate && Number.isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: 'Tham số "since" không hợp lệ' }, { status: 422 });
  }

  const vouchers = await prisma.voucher.findMany({
    where: {
      isActive: true,
      ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
      // Gộp trong AND: hai điều kiện đều dùng OR nên không thể để chung 1 object
      // (key `OR` thứ hai sẽ ghi đè key đầu → mất filter hết hạn).
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ...(categories.length
          ? [{ OR: [
              { category: { in: categories as never[] } },
              { categories: { hasSome: categories as never[] } },
            ] }]
          : []),
      ],
    },
    include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(vouchers.map(v => toDealCard(v, locale)));
}
