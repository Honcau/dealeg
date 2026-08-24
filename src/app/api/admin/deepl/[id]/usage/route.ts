import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { deeplKeyDto, refreshKeyUsage } from '@/lib/deepl';

function checkAuth(req: NextRequest): boolean {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

// POST /api/admin/deepl/[id]/usage — kiểm tra credit 1 key (gọi live /v2/usage)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const row = await prisma.deeplKey.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: 'Không tìm thấy key' }, { status: 404 });

  const usage = await refreshKeyUsage(row.id, row.key);
  const fresh = await prisma.deeplKey.findUnique({ where: { id } });
  return NextResponse.json({ ok: usage != null, key: deeplKeyDto(fresh!) });
}
