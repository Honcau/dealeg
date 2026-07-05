import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

type Params = { params: Promise<{ id: string }> };

// Nhãn ranh giới — dùng để tách title/excerpt/content khi paste
const MARK_TITLE   = '===== TITLE =====';
const MARK_EXCERPT = '===== EXCERPT =====';
const MARK_CONTENT = '===== CONTENT =====';

/**
 * GET — trả bản tiếng Anh dạng "khối markdown có nhãn" để admin copy vào DeepL web.
 * Cấu trúc giữ nguyên khi dịch, giúp tách lại 3 phần sau khi paste.
 */
export async function GET(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const en = await prisma.articleTranslation.findFirst({
    where: { articleId: id, locale: 'en' },
  });
  if (!en) return NextResponse.json({ error: 'Chưa có bản tiếng Anh' }, { status: 404 });

  // Ghép thành 1 khối có nhãn
  const block = [
    MARK_TITLE,
    en.title,
    '',
    MARK_EXCERPT,
    en.excerpt ?? '',
    '',
    MARK_CONTENT,
    en.content,
  ].join('\n');

  return NextResponse.json({ block, marks: { MARK_TITLE, MARK_EXCERPT, MARK_CONTENT } });
}

/**
 * POST — nhận khối đã dịch (paste về), tách theo nhãn, lưu vào ArticleTranslation.
 * body: { locale: string, text: string }
 */
export async function POST(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { locale, text } = await req.json();
  if (!locale || !text) {
    return NextResponse.json({ error: 'Thiếu locale hoặc nội dung' }, { status: 400 });
  }

  // Tách theo nhãn. DeepL có thể dịch cả chữ trong nhãn, nên tách linh hoạt:
  // tìm vị trí các dòng chứa "=====" và cắt theo thứ tự.
  const parsed = parseTranslatedBlock(text);
  if (!parsed) {
    return NextResponse.json({
      error: 'Không tách được nội dung. Đảm bảo giữ nguyên 3 dòng nhãn ===== khi dịch.',
    }, { status: 422 });
  }

  await prisma.articleTranslation.upsert({
    where:  { articleId_locale: { articleId: id, locale } },
    create: {
      articleId: id, locale,
      title: parsed.title, excerpt: parsed.excerpt, content: parsed.content,
      isAutoTranslated: true, translatedAt: new Date(),
    },
    update: {
      title: parsed.title, excerpt: parsed.excerpt, content: parsed.content,
      isAutoTranslated: true, translatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, locale });
}

/**
 * Tách khối đã dịch thành title/excerpt/content.
 * Chiến lược: tìm 3 dòng có "=====" (nhãn), lấy nội dung giữa chúng.
 * Linh hoạt với việc DeepL dịch chữ TITLE/EXCERPT/CONTENT trong nhãn.
 */
function parseTranslatedBlock(text: string): { title: string; excerpt: string; content: string } | null {
  const lines = text.split('\n');

  // Tìm index của 3 dòng nhãn (dòng chứa =====)
  const markIndexes: number[] = [];
  lines.forEach((line, i) => {
    if (line.includes('=====')) markIndexes.push(i);
  });

  if (markIndexes.length < 3) return null;

  const [i1, i2, i3] = markIndexes;

  // Nội dung giữa các nhãn
  const title   = lines.slice(i1 + 1, i2).join('\n').trim();
  const excerpt = lines.slice(i2 + 1, i3).join('\n').trim();
  const content = lines.slice(i3 + 1).join('\n').trim();

  if (!title || !content) return null;

  return { title, excerpt, content };
}
