import { NextRequest, NextResponse } from 'next/server';
import { z }      from 'zod';
import { prisma } from '@/lib/db';
import { makeFollowMatcher, OFFER_SOURCES } from '@/lib/offers';
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
  const [posts, sources, byAuthor, providers] = await Promise.all([
    prisma.offerPost.findMany({
      where:   status === 'ALL' ? {} : { status },
      orderBy: { postedAt: 'desc' },
      take:    300,
    }),
    prisma.offerSource.findMany({ orderBy: { username: 'asc' } }),
    // Đếm bài đã kéo về cho từng nguồn theo dõi (xem bên dưới vì sao không groupBy được)
    prisma.offerPost.findMany({ select: { author: true, title: true, tags: true } }),
    prisma.provider.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  // KHÔNG groupBy theo author được: trên LowEndBox tác giả luôn là biên tập viên LEB,
  // tên provider nằm trong tiêu đề/tag. Nên đếm bằng: tác giả trùng (LET) HOẶC tên khớp
  // tiêu đề/tag (LEB) — dùng chính hàm mà giao diện dùng để gắn nhãn ★, hai chỗ không lệch.
  const names   = sources.map(s => s.username);
  const byName  = new Map(names.map(n => [n.trim().toLowerCase(), n.toLowerCase()]));
  const matcher = makeFollowMatcher(names);
  const counts: Record<string, number> = {};
  for (const p of byAuthor) {
    const hit = byName.get(p.author.trim().toLowerCase()) ?? matcher(p.title, p.tags)?.toLowerCase();
    if (hit) counts[hit] = (counts[hit] ?? 0) + 1;
  }

  // Gắn sẵn tên provider khớp cho từng bài ngay tại server. Làm ở đây chứ không ở client
  // vì lib/offers.ts có import Prisma — kéo vào bundle trình duyệt là hỏng build; và làm
  // một chỗ thì nhãn ★ với ô đếm chắc chắn dùng chung một phép tính.
  const withMatch = posts.map(p => ({
    ...p,
    matched: byName.get(p.author.trim().toLowerCase()) ? p.author : matcher(p.title, p.tags),
  }));

  return NextResponse.json({
    posts: withMatch, sources, counts, providers,
    // Giao diện dựng nhãn + bộ lọc nguồn từ đây → thêm nguồn mới không phải sửa trang admin
    sourceMeta: OFFER_SOURCES.map(s => ({ key: s.key, label: s.label })),
  });
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
