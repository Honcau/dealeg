import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

type Params = { params: Promise<{ id: string }> };

const MARK_TITLE = '===== TITLE =====';
const MARK_DESC  = '===== DESCRIPTION =====';

/**
 * GET — trả bản tiếng Anh (title + description) có nhãn, để copy vào DeepL.
 * Voucher ngắn nên không cần chia đoạn.
 */
export async function GET(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const en = await prisma.voucherTranslation.findFirst({
    where: { voucherId: id, locale: 'en' },
  });
  if (!en) return NextResponse.json({ error: 'Chưa có bản tiếng Anh' }, { status: 404 });

  const block = [
    MARK_TITLE, en.title, '',
    MARK_DESC, en.description ?? '',
  ].join('\n');

  // Danh sách bản dịch đã có (để hiện ✓)
  const existing = await prisma.voucherTranslation.findMany({
    where: { voucherId: id, locale: { not: 'en' } },
    select: { locale: true },
  });

  return NextResponse.json({ block, existingLocales: existing.map(e => e.locale) });
}

/**
 * POST — nhận khối đã dịch, tách theo nhãn, lưu.
 * body: { locale, text }
 */
export async function POST(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { locale, text } = await req.json();
  if (!locale || !text) {
    return NextResponse.json({ error: 'Thiếu locale hoặc nội dung' }, { status: 400 });
  }

  const parsed = parseBlock(text);
  if (!parsed) {
    return NextResponse.json({
      error: 'Không tách được. Đảm bảo bản dịch còn đủ 2 dòng nhãn =====.',
    }, { status: 422 });
  }

  await prisma.voucherTranslation.upsert({
    where:  { voucherId_locale: { voucherId: id, locale } },
    create: { voucherId: id, locale, title: parsed.title, description: parsed.description },
    update: { title: parsed.title, description: parsed.description },
  });

  return NextResponse.json({ ok: true, locale });
}

function parseBlock(text: string): { title: string; description: string } | null {
  const lines = text.split('\n');
  const marks: number[] = [];
  lines.forEach((l, i) => { if (l.includes('=====')) marks.push(i); });
  if (marks.length < 2) return null;
  const [i1, i2] = marks;
  const title = lines.slice(i1 + 1, i2).join('\n').trim();
  const description = lines.slice(i2 + 1).join('\n').trim();
  if (!title) return null;
  return { title, description };
}
