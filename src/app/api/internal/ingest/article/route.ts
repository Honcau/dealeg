import { NextRequest, NextResponse } from 'next/server';
import { z }                    from 'zod';
import { prisma }               from '@/lib/db';
import { checkInternalAuth }    from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

const ArticleIngest = z.object({
  title:      z.string().min(3).max(300),
  content:    z.string().min(10),
  slug:       z.string().regex(/^[a-z0-9-]+$/, 'Chỉ chữ thường, số, gạch ngang').max(200).optional(),
  excerpt:    z.string().max(2000).optional(),
  category:   z.string().max(60).optional(),
  coverImage: z.string().url().max(2000).optional(),
  sourceUrl:  z.string().url().max(2000).optional(),
});

/** Tiêu đề → slug an toàn (a-z0-9-), bỏ dấu tiếng Việt. */
export function slugify(s: string): string {
  return s
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')   // bỏ dấu tiếng Việt
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'bai-viet';
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 2; await prisma.article.findUnique({ where: { slug }, select: { id: true } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

/**
 * POST /api/internal/ingest/article
 * Header: Authorization: Bearer <INTERNAL_API_TOKEN>
 *
 * Tạo bài NHÁP (status=DRAFT) từ nguồn tự động (n8n). Người vận hành duyệt ở /admin.
 * Chống trùng theo slug: truyền slug ỔN ĐỊNH (từ id/tiêu đề nguồn) để chạy lại không
 * tạo trùng — slug đã tồn tại thì skip. Không truyền slug → tự sinh unique từ title.
 * Chỉ gọi được trong mạng Docker (Nginx đã 404 /api/internal từ internet).
 */
export async function POST(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = ArticleIngest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const d = parsed.data;

  if (d.slug) {
    const exists = await prisma.article.findUnique({ where: { slug: d.slug }, select: { id: true } });
    if (exists) return NextResponse.json({ ok: true, skipped: 'duplicate', id: exists.id, slug: d.slug });
  }
  const slug = d.slug ?? await uniqueSlug(slugify(d.title));

  // Ghi nguồn vào cuối nội dung để người duyệt biết xuất xứ (Article không có field sourceUrl)
  const content = d.sourceUrl ? `${d.content}\n\n> Nguồn: ${d.sourceUrl}` : d.content;

  const article = await prisma.article.create({
    data: {
      slug,
      status:     'DRAFT',
      category:   d.category,
      coverImage: d.coverImage,
      translations: {
        create: { locale: 'en', title: d.title, excerpt: d.excerpt ?? '', content, isAutoTranslated: false },
      },
    },
    select: { id: true, slug: true },
  });
  return NextResponse.json({ ok: true, created: true, id: article.id, slug: article.slug }, { status: 201 });
}
