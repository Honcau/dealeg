import { NextRequest, NextResponse } from 'next/server';
import { z }      from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

const Add = z.object({
  username: z.string().min(1).max(80).transform(v => v.trim()),
  note:     z.string().max(200).optional(),
});

/** POST /api/admin/offers/sources — theo dõi thêm 1 username trên LET. */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = Add.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { username, note } = parsed.data;
  // Đã theo dõi rồi thì bật lại thay vì báo lỗi trùng (đỡ khó chịu khi thêm nhầm cái đã ẩn)
  const row = await prisma.offerSource.upsert({
    where:  { source_username: { source: 'lowendtalk', username } },
    create: { source: 'lowendtalk', username, note },
    update: { isActive: true, ...(note !== undefined ? { note } : {}) },
  });
  return NextResponse.json({ ok: true, source: row }, { status: 201 });
}

/** DELETE /api/admin/offers/sources — bỏ theo dõi. Body: { id } */
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json().catch(() => ({ id: '' }));
  if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });

  await prisma.offerSource.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}

const Edit = z.object({
  id:         z.string().min(1),
  username:   z.string().min(1).max(80).transform(v => v.trim()).optional(),
  note:       z.string().max(200).nullable().optional(),
  providerId: z.string().nullable().optional(),
  isActive:   z.boolean().optional(),
});

/**
 * PATCH /api/admin/offers/sources — sửa 1 nguồn theo dõi.
 *
 * Đổi username KHÔNG sửa ngược các bài đã kéo về: `author` trên OfferPost là lịch sử
 * đúng như feed lúc đó, viết đè sẽ làm sai dữ liệu. Hệ quả: số bài của nguồn vừa đổi
 * tên sẽ về 0 cho tới lần kéo sau — UI nói rõ điều này.
 */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = Edit.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { id, ...data } = parsed.data;
  try {
    const row = await prisma.offerSource.update({ where: { id }, data });
    return NextResponse.json({ ok: true, source: row });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Đã theo dõi username này rồi' }, { status: 409 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Không tìm thấy nguồn' }, { status: 404 });
    }
    throw e;
  }
}
