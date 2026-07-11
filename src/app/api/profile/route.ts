import { NextRequest, NextResponse } from 'next/server';
import { z }          from 'zod';
import { prisma }     from '@/lib/db';
import { getSession } from '@/lib/auth';
import { normalizeLocale } from '@/lib/locales';

// GET — lấy data cho trang profile
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const [comments, accounts, user] = await Promise.all([
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
    prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { language: true },
    }),
  ]);

  return NextResponse.json({ comments, accounts, language: user?.language ?? 'en' });
}

// PATCH — cập nhật tên
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const body = z.object({
    name:     z.string().min(2).max(50).transform(v => v.trim()).optional(),
    language: z.string().optional(),
  }).parse(await req.json());

  const data: { name?: string; language?: string } = {};
  if (body.name !== undefined)     data.name     = body.name;
  if (body.language !== undefined) data.language = normalizeLocale(body.language);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true, image: true, language: true },
  });

  const res = NextResponse.json(user);
  // Đổi ngôn ngữ → set cookie để giao diện chuyển theo ngay
  if (data.language) {
    res.cookies.set('NEXT_LOCALE', data.language, { path: '/', maxAge: 31536000 });
  }
  return res;
}
