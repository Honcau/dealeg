import { NextRequest, NextResponse } from 'next/server';
import { z }                        from 'zod';
import { prisma }                   from '@/lib/db';
import { checkInternalAuth }        from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

const SentSchema = z.object({
  sends: z.array(z.object({
    botUserId: z.number().int(),
    dealId:    z.string().min(1),
    channel:   z.string().default('bot'),
  })).min(1).max(500),
});

/**
 * POST /api/internal/bot/sent — bot báo lại các deal đã gửi xong.
 * Ghi vào SentDeal (unique botUserId+dealId+channel) → lần cron sau không gửi lại.
 * skipDuplicates để bot có thể retry an toàn.
 */
export async function POST(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = SentSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const res = await prisma.sentDeal.createMany({
    data: parsed.data.sends,
    skipDuplicates: true,
  });

  return NextResponse.json({ recorded: res.count });
}
