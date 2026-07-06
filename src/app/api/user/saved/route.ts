import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** GET /api/user/saved — danh sách voucher đã lưu */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ saved: [] });

  const saved = await prisma.savedVoucher.findMany({
    where: { userId: user.id },
    include: { voucher: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    saved: saved.map(s => ({
      id:       s.voucher.id,
      provider: s.voucher.provider,
      code:     s.voucher.code,
      discount: s.voucher.discount,
      discountValue: s.voucher.discountValue,
      savedAt:  s.createdAt,
    })),
  });
}

/** POST /api/user/saved — lưu/bỏ lưu voucher (toggle). body: { voucherId } */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });

  const { voucherId } = await req.json();
  if (!voucherId) return NextResponse.json({ error: 'Thiếu voucherId' }, { status: 400 });

  // Toggle: nếu đã lưu → bỏ, chưa lưu → thêm
  const existing = await prisma.savedVoucher.findUnique({
    where: { userId_voucherId: { userId: user.id, voucherId } },
  });

  if (existing) {
    await prisma.savedVoucher.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  } else {
    await prisma.savedVoucher.create({ data: { userId: user.id, voucherId } });
    return NextResponse.json({ saved: true });
  }
}
