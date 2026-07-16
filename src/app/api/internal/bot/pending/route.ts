import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/db';
import { checkInternalAuth }         from '@/lib/internal-auth';
import { toDealCard, type DealCard } from '@/lib/deal-card';

export const dynamic = 'force-dynamic';

const DEAL_WINDOW_DAYS = 7;    // chỉ xét deal mới trong 7 ngày
const MAX_PER_USER     = 3;    // tối đa 3 deal/user mỗi lượt cron (tránh spam)

export interface PendingSend {
  botUserId: number;
  chatId:    string;
  locale:    string;
  deal:      DealCard;
}

/**
 * GET /api/internal/bot/pending?limit=200
 * Header: Authorization: Bearer <INTERNAL_API_TOKEN>
 *
 * Trả danh sách (user × deal) cần gửi. Toàn bộ logic ghép + chống trùng nằm ở đây
 * (Next.js giữ business logic + Prisma), bot chỉ việc render & gửi.
 *
 * Quy tắc:
 * - chỉ user đang active
 * - chỉ deal tạo SAU khi user opt-in (không dội lại toàn bộ deal cũ cho người mới)
 * - lọc theo categories của user (rỗng = nhận tất cả)
 * - bỏ deal đã có trong SentDeal(channel='bot')
 */
export async function GET(req: NextRequest) {
  if (!checkInternalAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 200) || 200, 500);
  const windowStart = new Date(Date.now() - DEAL_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [users, vouchers] = await Promise.all([
    prisma.botUser.findMany({
      where: { isActive: true, platform: 'telegram' },
      orderBy: { id: 'asc' },
      take: 500,
    }),
    prisma.voucher.findMany({
      where: {
        isActive: true,
        createdAt: { gte: windowStart },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { translations: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  if (users.length === 0 || vouchers.length === 0) return NextResponse.json([]);

  // Nạp trước các cặp đã gửi để lọc trong bộ nhớ (1 query thay vì N)
  const sent = await prisma.sentDeal.findMany({
    where: { channel: 'bot', dealId: { in: vouchers.map(v => v.id) } },
    select: { botUserId: true, dealId: true },
  });
  const sentSet = new Set(sent.map(s => `${s.botUserId}:${s.dealId}`));

  const out: PendingSend[] = [];
  for (const u of users) {
    let perUser = 0;
    for (const v of vouchers) {
      if (perUser >= MAX_PER_USER || out.length >= limit) break;
      if (v.createdAt <= u.optInAt) continue;                                   // deal cũ hơn lúc opt-in
      // voucher có thể thuộc nhiều danh mục → khớp nếu user quan tâm BẤT KỲ cái nào
      const vCats = (v.categories.length ? v.categories : [v.category]).map(c => c.toLowerCase());
      if (u.categories.length && !vCats.some(c => u.categories.includes(c))) continue;
      if (sentSet.has(`${u.id}:${v.id}`)) continue;                             // đã gửi rồi

      out.push({ botUserId: u.id, chatId: u.chatId, locale: u.locale, deal: toDealCard(v, u.locale) });
      perUser++;
    }
    if (out.length >= limit) break;
  }

  return NextResponse.json(out);
}
