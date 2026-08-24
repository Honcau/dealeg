import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { prisma }                    from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { deeplKeyDto, refreshKeyUsage } from '@/lib/deepl';

function checkAuth(req: NextRequest): boolean {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

// GET /api/admin/deepl — danh sách key (đã che)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const keys = await prisma.deeplKey.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(keys.map(deeplKeyDto));
}

const CreateSchema = z.object({
  label: z.string().min(1).max(60).transform(v => v.trim()),
  key:   z.string().min(10).transform(v => v.trim()),
});

// POST /api/admin/deepl — thêm key mới (check credit ngay)
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const exists = await prisma.deeplKey.findUnique({ where: { key: parsed.data.key } });
  if (exists) return NextResponse.json({ error: 'Key này đã có' }, { status: 409 });

  const created = await prisma.deeplKey.create({ data: parsed.data });
  // Gọi /v2/usage ngay để hiện credit + xác nhận key hợp lệ
  await refreshKeyUsage(created.id, created.key);
  const fresh = await prisma.deeplKey.findUnique({ where: { id: created.id } });
  return NextResponse.json(deeplKeyDto(fresh!), { status: 201 });
}
