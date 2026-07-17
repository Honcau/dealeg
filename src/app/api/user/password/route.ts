import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** POST /api/user/password — đổi mật khẩu (cần đăng nhập + mật khẩu cũ đúng) */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ code: 'UNAUTH' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ code: 'TOO_SHORT' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ code: 'NO_ACCOUNT' }, { status: 404 });

  // Nếu user đăng ký bằng OAuth (chưa có password) → cho đặt mật khẩu mới không cần cũ
  if (user.password) {
    const valid = await bcrypt.compare(currentPassword ?? '', user.password);
    if (!valid) {
      return NextResponse.json({ code: 'WRONG_CURRENT' }, { status: 400 });
    }
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data:  { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
