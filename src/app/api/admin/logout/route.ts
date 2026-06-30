import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME }               from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;  // https://dealeg.com hoặc http://localhost:3000
  const res    = NextResponse.redirect(`${origin}/admin/login`);
  res.cookies.delete(COOKIE_NAME);
  return res;
}
