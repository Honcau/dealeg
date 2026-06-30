import { NextRequest, NextResponse } from 'next/server';
import { z }          from 'zod';
import { prisma }     from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

const ArticleSchema = z.object({
  slug:        z.string().min(2).regex(/^[a-z0-9-]+$/, 'Chỉ dùng chữ thường, số, dấu gạch ngang'),
  status:      z.enum(['DRAFT','PUBLISHED','ARCHIVED']).default('DRAFT'),
  category:    z.string().optional(),
  coverImage:  z.string().url().optional().or(z.literal('')),
  // English translation
  title:       z.string().min(3),
  excerpt:     z.string().optional(),
  content:     z.string().min(10),
});

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const articles = await prisma.article.findMany({
    include: {
      translations: { select: { locale: true, title: true, isAutoTranslated: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = ArticleSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { title, excerpt, content, slug, status, category, coverImage } = parsed.data;

  // Kiểm tra slug đã tồn tại chưa
  const exists = await prisma.article.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: { slug: ['Slug đã tồn tại'] } }, { status: 409 });

  const article = await prisma.article.create({
    data: {
      slug, status, category,
      coverImage: coverImage || null,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      translations: {
        create: { locale: 'en', title, excerpt: excerpt ?? '', content },
      },
    },
    include: { translations: true },
  });

  return NextResponse.json(article, { status: 201 });
}
