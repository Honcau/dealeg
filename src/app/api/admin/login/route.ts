import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken, COOKIE_NAME, safeEqual } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const secret = process.env.ADMIN_SECRET ?? '';
  if (!password || !secret || !safeEqual(String(password), secret)) {
    return NextResponse.json({ error: 'Sai mật khẩu' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set(COOKIE_NAME, getAdminToken(), {
    httpOnly: true,                                    // JS không đọc được
    secure:   process.env.NODE_ENV === 'production',   // HTTPS only trên prod
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,                           // 24 giờ
    path:     '/',
  });

  return res;
}
