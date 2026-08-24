import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { translateTexts } from '@/lib/deepl';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

/**
 * POST /api/admin/vouchers/[id]/translate
 * Dịch title + description tiếng Anh của voucher sang 11 ngôn ngữ.
 * Dùng LÕI DỊCH DÙNG CHUNG (src/lib/deepl.ts) — pool key + tự xoay khi hết quota,
 * y hệt phần dịch bài viết.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const en = await prisma.voucherTranslation.findUnique({
    where: { voucherId_locale: { voucherId: id, locale: 'en' } },
  });
  if (!en) return NextResponse.json({ error: 'Cần có bản tiếng Anh trước' }, { status: 400 });

  const translated = await translateTexts([en.title, en.description ?? '']);

  let done = 0;
  for (const r of translated) {
    if (r.success && r.texts) {
      const [title, description] = r.texts;
      await prisma.voucherTranslation.upsert({
        where:  { voucherId_locale: { voucherId: id, locale: r.locale } },
        create: { voucherId: id, locale: r.locale, title, description },
        update: { title, description },
      });
      done++;
    }
  }

  // Kèm lỗi thật đầu tiên (VD "DeepL 456: …") để chẩn đoán, không giấu như trước
  const firstErr = translated.find(r => !r.success)?.error;
  return NextResponse.json({ ok: true, summary: `${done}/${translated.length} ngôn ngữ`, error: firstErr });
}
