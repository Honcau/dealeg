import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { prisma }                    from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { deeplKeyDto, refreshKeyUsage } from '@/lib/deepl';

function checkAuth(req: NextRequest): boolean {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

type Params = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  label:    z.string().min(1).max(60).transform(v => v.trim()).optional(),
  key:      z.string().min(10).transform(v => v.trim()).optional(),   // để trống = giữ key cũ
  isActive: z.boolean().optional(),
});

// PATCH /api/admin/deepl/[id] — sửa label / thay key / bật-tắt
export async function PATCH(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const { label, key, isActive } = parsed.data;

  // Thay key → phải chưa trùng key khác + reset cache usage để check lại
  if (key) {
    const dup = await prisma.deeplKey.findUnique({ where: { key } });
    if (dup && dup.id !== id) return NextResponse.json({ error: 'Key này đã có ở dòng khác' }, { status: 409 });
  }

  const updated = await prisma.deeplKey.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(key ? { key, charCount: null, charLimit: null, usageCheckedAt: null } : {}),
    },
  }).catch(() => null);
  if (!updated) return NextResponse.json({ error: 'Không tìm thấy key' }, { status: 404 });

  if (key) await refreshKeyUsage(updated.id, updated.key);   // key mới → check credit ngay
  const fresh = await prisma.deeplKey.findUnique({ where: { id } });
  return NextResponse.json(deeplKeyDto(fresh!));
}

// DELETE /api/admin/deepl/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.deeplKey.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
