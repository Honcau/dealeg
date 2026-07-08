import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

// Dùng lại DeepL từ translation service
const DEEPL_LANG: Record<string, string> = {
  vi: 'VI', zh: 'ZH', hi: 'HI', es: 'ES', pt: 'PT-BR',
  fr: 'FR', de: 'DE', ar: 'AR', ru: 'RU', ja: 'JA', ko: 'KO',
};

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

async function translate(text: string, target: string): Promise<string> {
  const key = process.env.DEEPL_API_KEY;
  if (!key || !text) return text;
  const endpoint = key.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: [text], source_lang: 'EN', target_lang: target }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`DeepL ${res.status}`);
  const data = await res.json();
  return data.translations[0].text;
}

/**
 * POST /api/admin/vouchers/[id]/translate
 * Dịch title + description tiếng Anh của voucher sang 11 ngôn ngữ bằng DeepL.
 * TÙY CHỌN — chỉ dùng khi admin bấm nút, không tự động.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const en = await prisma.voucherTranslation.findUnique({
    where: { voucherId_locale: { voucherId: id, locale: 'en' } },
  });
  if (!en) return NextResponse.json({ error: 'Cần có bản tiếng Anh trước' }, { status: 400 });

  const results: { locale: string; ok: boolean }[] = [];

  for (const [locale, lang] of Object.entries(DEEPL_LANG)) {
    try {
      const title = await translate(en.title, lang);
      await new Promise(r => setTimeout(r, 300));
      const description = en.description ? await translate(en.description, lang) : '';

      await prisma.voucherTranslation.upsert({
        where:  { voucherId_locale: { voucherId: id, locale } },
        create: { voucherId: id, locale, title, description },
        update: { title, description },
      });
      results.push({ locale, ok: true });
      await new Promise(r => setTimeout(r, 500));
    } catch {
      results.push({ locale, ok: false });
    }
  }

  const done = results.filter(r => r.ok).length;
  return NextResponse.json({ ok: true, summary: `${done}/${results.length} ngôn ngữ` });
}
