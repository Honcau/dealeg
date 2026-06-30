import { NextRequest, NextResponse } from 'next/server';
import { z }          from 'zod';
import { prisma }     from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET — lấy data cho trang profile
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const [comments, accounts] = await Promise.all([
    prisma.comment.findMany({
      where: { userId: session.user.id },
      include: {
        voucher: { select: { id: true, code: true, provider: true } },
        votes:   { select: { value: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.account.findMany({
      where:  { userId: session.user.id },
      select: { provider: true },
    }),
  ]);

  return NextResponse.json({ comments, accounts });
}

// PATCH — cập nhật tên
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { name } = z.object({
    name: z.string().min(2).max(50).transform(v => v.trim()),
  }).parse(await req.json());

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data:  { name },
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(user);
}
