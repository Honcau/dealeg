import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** POST /api/user/delete — xóa vĩnh viễn tài khoản + dữ liệu liên quan (cascade) */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ code: 'UNAUTH' }, { status: 401 });
  }

  const { confirmEmail } = await req.json();
  // Yêu cầu gõ đúng email để xác nhận (tránh xóa nhầm)
  if (confirmEmail !== session.user.email) {
    return NextResponse.json({ code: 'EMAIL_MISMATCH' }, { status: 400 });
  }

  // Xóa user → cascade tự xóa comments, votes, saved, alerts, sessions, accounts
  await prisma.user.delete({ where: { email: session.user.email } });

  return NextResponse.json({ ok: true });
}
