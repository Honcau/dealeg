import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

type Params = { params: Promise<{ id: string }> };

const MARK_TITLE   = '===== TITLE =====';
const MARK_EXCERPT = '===== EXCERPT =====';
const MARK_CONTENT = '===== CONTENT =====';

// Giới hạn DeepL web ~5000 ký tự. Chừa margin → cắt ở 4500.
const CHUNK_LIMIT = 4500;

/**
 * Chia text dài thành các đoạn ≤ limit, cắt theo ranh giới đoạn văn (\n\n)
 * để không đứt giữa câu — giúp DeepL dịch mạch lạc.
 */
function splitIntoChunks(text: string, limit: number): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let current = '';

  for (const para of paragraphs) {
    // Nếu 1 đoạn văn đã dài hơn limit → cắt cứng theo câu
    if (para.length > limit) {
      if (current) { chunks.push(current); current = ''; }
      const sentences = para.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if ((current + ' ' + s).length > limit) {
          if (current) chunks.push(current);
          current = s;
        } else {
          current = current ? current + ' ' + s : s;
        }
      }
      continue;
    }
    // Thêm đoạn văn vào chunk hiện tại nếu còn chỗ
    if ((current + '\n\n' + para).length > limit) {
      chunks.push(current);
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * GET — trả bản tiếng Anh, chia thành các đoạn ≤ 4500 ký tự để copy vào DeepL.
 * Mỗi đoạn có nhãn để admin biết đang dịch phần nào.
 */
export async function GET(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const en = await prisma.articleTranslation.findFirst({
    where: { articleId: id, locale: 'en' },
  });
  if (!en) return NextResponse.json({ error: 'Chưa có bản tiếng Anh' }, { status: 404 });

  // Khối đầy đủ có nhãn
  const fullBlock = [
    MARK_TITLE, en.title, '',
    MARK_EXCERPT, en.excerpt ?? '', '',
    MARK_CONTENT, en.content,
  ].join('\n');

  // Chia thành các đoạn ≤ 4500
  const chunks = splitIntoChunks(fullBlock, CHUNK_LIMIT);

  return NextResponse.json({
    fullBlock,
    chunks,
    totalChars: fullBlock.length,
    chunkCount: chunks.length,
  });
}

/**
 * POST — nhận khối đã dịch (đã ghép đủ), tách theo nhãn, lưu.
 * body: { locale, text }
 */
export async function POST(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { locale, text } = await req.json();
  if (!locale || !text) {
    return NextResponse.json({ error: 'Thiếu locale hoặc nội dung' }, { status: 400 });
  }

  const parsed = parseTranslatedBlock(text);
  if (!parsed) {
    return NextResponse.json({
      error: 'Không tách được nội dung. Đảm bảo bản dịch còn đủ 3 dòng nhãn =====.',
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

function parseTranslatedBlock(text: string): { title: string; excerpt: string; content: string } | null {
  const lines = text.split('\n');
  const markIndexes: number[] = [];
  lines.forEach((line, i) => { if (line.includes('=====')) markIndexes.push(i); });

  if (markIndexes.length < 3) return null;
  const [i1, i2, i3] = markIndexes;

  const title   = lines.slice(i1 + 1, i2).join('\n').trim();
  const excerpt = lines.slice(i2 + 1, i3).join('\n').trim();
  const content = lines.slice(i3 + 1).join('\n').trim();

  if (!title || !content) return null;
  return { title, excerpt, content };
}
