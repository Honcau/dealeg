import { NextRequest, NextResponse } from 'next/server';
import { z }          from 'zod';
import { prisma }     from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const article = await prisma.article.findUnique({
    where: { id },
    include: { translations: { orderBy: { locale: 'asc' } } },
  });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(article);
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const body = await req.json();
  const { title, excerpt, content, status, category, coverImage } = body;

  const article = await prisma.article.update({
    where: { id },
    data: {
      status, category,
      coverImage: coverImage || null,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
      updatedAt: new Date(),
    },
  });

  // Cập nhật bản tiếng Anh
  if (title || content) {
    await prisma.articleTranslation.upsert({
      where:  { articleId_locale: { articleId: id, locale: 'en' } },
      create: { articleId: id, locale: 'en', title: title ?? '', excerpt: excerpt ?? '', content: content ?? '' },
      update: { title, excerpt: excerpt ?? '', content, isAutoTranslated: false, updatedAt: new Date() },
    });
  }

  return NextResponse.json(article);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.articleTranslation.deleteMany({ where: { articleId: id } });
  await prisma.article.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
