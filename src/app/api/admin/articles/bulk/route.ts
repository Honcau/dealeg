import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

/**
 * POST /api/admin/articles/bulk
 * Thao tác hàng loạt: publish / draft / archive / delete nhiều bài cùng lúc.
 * Body: { ids: string[], action: 'publish' | 'draft' | 'archive' | 'delete' }
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ids, action } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No articles selected' }, { status: 400 });
  }

  switch (action) {
    case 'publish':
      await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { status: 'PUBLISHED', publishedAt: new Date(), updatedAt: new Date() },
      });
      break;

    case 'draft':
      await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { status: 'DRAFT', publishedAt: null, updatedAt: new Date() },
      });
      break;

    case 'archive':
      await prisma.article.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ARCHIVED', updatedAt: new Date() },
      });
      break;

    case 'delete':
      await prisma.articleTranslation.deleteMany({ where: { articleId: { in: ids } } });
      await prisma.article.deleteMany({ where: { id: { in: ids } } });
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, count: ids.length, action });
}
