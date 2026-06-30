/**
 * TRANSLATION SERVICE — DeepL API
 *
 * Chiến lược:
 *  1. Admin viết bài bằng tiếng Anh
 *  2. Bấm "Dịch ngay" → gọi translateArticle()
 *  3. DeepL dịch TUẦN TỰ từng ngôn ngữ (tránh rate limit free tier)
 *  4. Lưu vào ArticleTranslation (cache)
 *  5. Frontend serve từ DB
 *
 * DeepL free tier giới hạn số request đồng thời → phải dịch tuần tự,
 * không bắn song song, nếu không sẽ bị lỗi 429 (Too Many Requests).
 */
import { prisma } from '@/lib/db';

const DEEPL_LANG: Record<string, string> = {
  vi: 'VI',
  zh: 'ZH',
  hi: 'HI',
  es: 'ES',
  pt: 'PT-BR',
  fr: 'FR',
  de: 'DE',
  ar: 'AR',
  ru: 'RU',
  ja: 'JA',
  ko: 'KO',
};

export const TARGET_LOCALES = Object.keys(DEEPL_LANG);

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── Core DeepL call với retry ───────────────────────────────────────────────────

async function deepLTranslate(
  text: string,
  targetLang: string,
  retries = 3,
): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiKey) {
    console.warn('[DeepL] DEEPL_API_KEY chưa set — trả về text gốc');
    return `[${targetLang}] ${text}`;
  }

  const endpoint = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          source_lang: 'EN',
          target_lang: targetLang,
          tag_handling: 'html',
        }),
        signal: AbortSignal.timeout(30_000),
      });

      // 429 = rate limit → đợi rồi thử lại
      if (res.status === 429) {
        const wait = (attempt + 1) * 2000; // 2s, 4s, 6s
        console.warn(`[DeepL] Rate limit cho ${targetLang}, đợi ${wait}ms (lần ${attempt + 1})`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`DeepL ${res.status}: ${err}`);
      }

      const data = await res.json();
      return data.translations[0].text as string;

    } catch (err) {
      // Lần cuối thất bại → ném lỗi
      if (attempt === retries) throw err;
      await sleep((attempt + 1) * 1000);
    }
  }

  throw new Error(`DeepL: hết số lần thử cho ${targetLang}`);
}

// ── Translate article ──────────────────────────────────────────────────────────

export interface TranslateResult {
  locale:  string;
  success: boolean;
  error?:  string;
}

/**
 * Dịch 1 bài sang tất cả 11 ngôn ngữ — TUẦN TỰ.
 * Mỗi ngôn ngữ: dịch title → excerpt → content (tuần tự),
 * giữa các ngôn ngữ nghỉ 500ms để tránh rate limit.
 */
export async function translateArticle(articleId: string): Promise<TranslateResult[]> {
  const source = await prisma.articleTranslation.findUnique({
    where: { articleId_locale: { articleId, locale: 'en' } },
  });

  if (!source) throw new Error('Cần có bản tiếng Anh trước khi dịch');

  const results: TranslateResult[] = [];

  // TUẦN TỰ từng ngôn ngữ — KHÔNG dùng Promise.all
  for (const locale of TARGET_LOCALES) {
    const langCode = DEEPL_LANG[locale];

    try {
      // Dịch tuần tự từng field (không song song)
      const title = await deepLTranslate(source.title, langCode);
      await sleep(300);

      const excerpt = source.excerpt
        ? await deepLTranslate(source.excerpt, langCode)
        : '';
      await sleep(300);

      const content = await deepLTranslate(source.content, langCode);

      // Lưu vào DB
      await prisma.articleTranslation.upsert({
        where:  { articleId_locale: { articleId, locale } },
        create: { articleId, locale, title, excerpt, content, isAutoTranslated: true, translatedAt: new Date() },
        update: { title, excerpt, content, isAutoTranslated: true, translatedAt: new Date() },
      });

      results.push({ locale, success: true });
      console.log(`[DeepL] ✓ ${locale}`);

      // Nghỉ giữa các ngôn ngữ
      await sleep(500);

    } catch (err) {
      results.push({ locale, success: false, error: String(err) });
      console.error(`[DeepL] ✗ ${locale}: ${err}`);
      // Tiếp tục ngôn ngữ kế, không dừng
    }
  }

  return results;
}

/**
 * Lấy bản dịch theo locale với fallback chain:
 * requested locale → English → null
 */
export async function getArticleTranslation(articleId: string, locale: string) {
  const translation = await prisma.articleTranslation.findUnique({
    where: { articleId_locale: { articleId, locale } },
  });
  if (translation) return { translation, isFallback: false };

  const enTranslation = await prisma.articleTranslation.findUnique({
    where: { articleId_locale: { articleId, locale: 'en' } },
  });
  if (enTranslation) return { translation: enTranslation, isFallback: true };

  return { translation: null, isFallback: false };
}
