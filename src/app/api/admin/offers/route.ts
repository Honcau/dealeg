import { NextRequest, NextResponse } from 'next/server';
import { z }      from 'zod';
import { prisma } from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/offers?status=NEW — bài offer thô + danh sách provider đang theo dõi.
 *
 * SẮP THEO postedAt (ngày TẠO thread) GIẢM DẦN — không theo thứ tự feed. Feed LET xếp
 * theo hoạt động cuối nên thread cũ bị comment bump vẫn nằm đầu feed; sắp theo ngày tạo
 * mới đẩy bài thật sự mới lên trước, thread bị bump chìm xuống dưới.
 */
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const status = req.nextUrl.searchParams.get('status') ?? 'NEW';
  const [posts, sources] = await Promise.all([
    prisma.offerPost.findMany({
      where:   status === 'ALL' ? {} : { status },
      orderBy: { postedAt: 'desc' },
      take:    300,
    }),
    prisma.offerSource.findMany({ orderBy: { username: 'asc' } }),
  ]);

  return NextResponse.json({ posts, sources });
}

const Patch = z.object({
  id:     z.string().min(1),
  status: z.enum(['NEW', 'DONE', 'IGNORED']),
});

/** PATCH /api/admin/offers — đánh dấu 1 bài đã xử lý / bỏ qua. */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  await prisma.offerPost.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
