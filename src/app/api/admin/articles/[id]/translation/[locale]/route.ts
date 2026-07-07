import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

type Params = { params: Promise<{ id: string; locale: string }> };

/**
 * GET /api/admin/articles/[id]/translation/[locale]
 * Lấy 1 bản dịch cụ thể (title/excerpt/content) để edit.
 */
export async function GET(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, locale } = await params;

  const tr = await prisma.articleTranslation.findUnique({
    where: { articleId_locale: { articleId: id, locale } },
  });

  // Chưa có bản dịch → trả rỗng (không lỗi)
  return NextResponse.json(tr ?? { locale, title: '', excerpt: '', content: '', isAutoTranslated: false });
}

/**
 * PUT /api/admin/articles/[id]/translation/[locale]
 * Lưu trực tiếp 1 bản dịch (edit khung phải hoặc sau khi paste).
 * body: { title, excerpt, content, markReviewed? }
 */
export async function PUT(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, locale } = await params;

  const { title, excerpt, content, markReviewed } = await req.json();
  if (!title && !content) {
    return NextResponse.json({ error: 'Cần ít nhất tiêu đề hoặc nội dung' }, { status: 400 });
  }

  // markReviewed=true khi admin sửa tay → đánh dấu là bản đã review (không phải auto)
  const isAutoTranslated = markReviewed ? false : undefined;

  const tr = await prisma.articleTranslation.upsert({
    where:  { articleId_locale: { articleId: id, locale } },
    create: {
      articleId: id, locale,
      title: title ?? '', excerpt: excerpt ?? '', content: content ?? '',
      isAutoTranslated: markReviewed ? false : true,
      translatedAt: new Date(),
    },
    update: {
      title: title ?? '', excerpt: excerpt ?? '', content: content ?? '',
      ...(isAutoTranslated !== undefined ? { isAutoTranslated } : {}),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, locale, isAutoTranslated: tr.isAutoTranslated });
}
