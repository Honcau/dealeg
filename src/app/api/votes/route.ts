/**
 * POST /api/votes
 * Body: { voucherId, type: 'WORKS' | 'EXPIRED' }
 * - Nếu chưa vote → tạo mới
 * - Nếu đã vote cùng type → xoá (toggle off)
 * - Nếu đã vote khác type → đổi sang type mới
 */
import { NextRequest, NextResponse }  from 'next/server';
import { getServerSession }           from 'next-auth';
import { authOptions }                from '@/lib/auth';
import { prisma }                     from '@/lib/db';
import { z }                          from 'zod';

const Schema = z.object({
  voucherId: z.string().min(1),
  type:      z.enum(['WORKS', 'EXPIRED']),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Cần đăng nhập để vote' }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: 'User ID not found' }, { status: 401 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid' }, { status: 422 });

  const { voucherId, type } = parsed.data;

  // Kiểm tra voucher tồn tại
  const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } });
  if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

  // Tìm vote hiện tại
  const existing = await prisma.vote.findUnique({
    where: { userId_voucherId: { userId, voucherId } },
  });

  if (existing) {
    if (existing.type === type) {
      // Cùng type → toggle off (xoá vote)
      await prisma.vote.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed', type });
    } else {
      // Khác type → đổi
      await prisma.vote.update({ where: { id: existing.id }, data: { type } });
      return NextResponse.json({ action: 'changed', type });
    }
  }

  // Chưa vote → tạo mới
  await prisma.vote.create({ data: { userId, voucherId, type } });

  // Tự động đánh dấu hết hạn nếu số vote EXPIRED >> WORKS
  if (type === 'EXPIRED') {
    const [expired, works] = await Promise.all([
      prisma.vote.count({ where: { voucherId, type: 'EXPIRED' } }),
      prisma.vote.count({ where: { voucherId, type: 'WORKS' } }),
    ]);
    // Nếu 5+ phiếu hết hạn và nhiều hơn gấp đôi phiếu còn dùng → tắt voucher
    if (expired >= 5 && expired > works * 2) {
      await prisma.voucher.update({
        where: { id: voucherId },
        data:  { isActive: false },
      });
    }
  }

  return NextResponse.json({ action: 'added', type });
}

export async function GET(req: NextRequest) {
  const voucherId = req.nextUrl.searchParams.get('voucherId');
  if (!voucherId) return NextResponse.json({ error: 'Missing voucherId' }, { status: 400 });

  const session = await getServerSession(authOptions);
  const userId  = (session?.user as { id?: string } | undefined)?.id;

  const [works, expired, userVote] = await Promise.all([
    prisma.vote.count({ where: { voucherId, type: 'WORKS' } }),
    prisma.vote.count({ where: { voucherId, type: 'EXPIRED' } }),
    userId
      ? prisma.vote.findUnique({ where: { userId_voucherId: { userId, voucherId } } })
      : null,
  ]);

  return NextResponse.json({ works, expired, userVote: userVote?.type ?? null });
}
