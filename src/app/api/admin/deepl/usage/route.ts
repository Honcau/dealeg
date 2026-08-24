import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { deeplKeyDto, refreshKeyUsage } from '@/lib/deepl';

function checkAuth(req: NextRequest): boolean {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

// POST /api/admin/deepl/usage — kiểm tra credit TẤT CẢ key (refresh cả pool)
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await prisma.deeplKey.findMany();
  await Promise.all(keys.map(k => refreshKeyUsage(k.id, k.key)));

  const fresh = await prisma.deeplKey.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(fresh.map(deeplKeyDto));
}
