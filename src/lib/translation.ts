/**
 * TRANSLATION SERVICE — DeepL API
 *
 * TỐI ƯU:
 *  - Gộp title + excerpt + content vào 1 request (giảm 3× số call)
 *  - Tuần tự từng ngôn ngữ, delay giữa các call
 *  - Xử lý 429 (rate limit): retry với backoff
 *  - Xử lý 456 (quota): dừng ngay, không cố tiếp
 *  - Bỏ qua ngôn ngữ đã dịch (chạy lại không tốn quota)
 */
import { prisma } from '@/lib/db';
import { pickDeeplKey, markKeyExhausted, deeplHost } from '@/lib/deepl';

const DEEPL_LANG: Record<string, string> = {
  vi: 'VI', zh: 'ZH', hi: 'HI', es: 'ES', pt: 'PT-BR',
  fr: 'FR', de: 'DE', ar: 'AR', ru: 'RU', ja: 'JA', ko: 'KO',
};

export const TARGET_LOCALES = Object.keys(DEEPL_LANG);

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// Lỗi quota — throw riêng để dừng toàn bộ vòng lặp
class QuotaError extends Error {}

/**
 * Dịch NHIỀU đoạn text trong 1 request (DeepL nhận array).
 * Trả về array kết quả cùng thứ tự input.
 */
async function deepLTranslateBatch(
  texts: string[],
  targetLang: string,
  apiKey: string,
  retries = 3,
): Promise<string[]> {
  const endpoint = `https://${deeplHost(apiKey)}/v2/translate`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: texts,           // ← gửi cả mảng trong 1 request
          source_lang: 'EN',
          target_lang: targetLang,
          tag_handling: 'html',
        }),
        signal: AbortSignal.timeout(60_000),
      });

      // 456 = quota hết → dừng hẳn, không retry
      if (res.status === 456) {
        throw new QuotaError('DeepL quota exceeded (456)');
      }

      // 429 = rate limit → đợi lâu hơn rồi thử lại
      if (res.status === 429) {
        const wait = (attempt + 1) * 5000; // 5s, 10s, 15s
        console.warn(`[DeepL] 429 rate limit ${targetLang}, đợi ${wait}ms`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        // 456 có thể nằm trong body
        if (err.includes('Quota exceeded') || res.status === 456) {
          throw new QuotaError(`DeepL quota: ${err}`);
        }
        throw new Error(`DeepL ${res.status}: ${err}`);
      }

      const data = await res.json();
      return data.translations.map((t: { text: string }) => t.text);

    } catch (err) {
      if (err instanceof QuotaError) throw err; // quota → không retry
      if (attempt === retries) throw err;
      await sleep((attempt + 1) * 2000);
    }
  }

  throw new Error(`DeepL: hết số lần thử cho ${targetLang}`);
}

export interface TranslateResult {
  locale:  string;
  success: boolean;
  error?:  string;
}

export async function translateArticle(articleId: string): Promise<TranslateResult[]> {
  const source = await prisma.articleTranslation.findUnique({
    where: { articleId_locale: { articleId, locale: 'en' } },
  });

  if (!source) throw new Error('Cần có bản tiếng Anh trước khi dịch');

  const results: TranslateResult[] = [];
  let key = await pickDeeplKey();   // key đang dùng; null = không còn key nào có quota

  for (const locale of TARGET_LOCALES) {
    const langCode = DEEPL_LANG[locale];

    // Bỏ qua ngôn ngữ đã dịch sau lần sửa bản gốc
    const existing = await prisma.articleTranslation.findUnique({
      where: { articleId_locale: { articleId, locale } },
    });
    if (existing && existing.updatedAt > source.updatedAt) {
      results.push({ locale, success: true });
      console.log(`[DeepL] ⏭ ${locale} — đã có`);
      continue;
    }

    // Thử locale này; gặp 456 thì XOAY sang key khác và thử lại, tới khi hết key
    let done = false;
    while (!done) {
      if (!key) {
        results.push({ locale, success: false, error: 'Quota exceeded' });
        break;
      }
      try {
        // GỘP 3 field vào 1 request
        const [title, excerpt, content] = await deepLTranslateBatch(
          [source.title, source.excerpt ?? '', source.content],
          langCode,
          key,
        );

        await prisma.articleTranslation.upsert({
          where:  { articleId_locale: { articleId, locale } },
          create: { articleId, locale, title, excerpt, content, isAutoTranslated: true, translatedAt: new Date() },
          update: { title, excerpt, content, isAutoTranslated: true, translatedAt: new Date() },
        });

        results.push({ locale, success: true });
        console.log(`[DeepL] ✓ ${locale}`);
        await sleep(1000);   // delay 1s giữa các ngôn ngữ
        done = true;

      } catch (err) {
        if (err instanceof QuotaError) {
          await markKeyExhausted(key);
          key = await pickDeeplKey(key);   // key này hết → lấy key khác, thử lại locale
          console.warn(`[DeepL] ↻ ${locale}: key hết quota → ${key ? 'chuyển key khác' : 'hết sạch key'}`);
        } else {
          results.push({ locale, success: false, error: String(err) });
          console.error(`[DeepL] ✗ ${locale}: ${err}`);
          done = true;
        }
      }
    }
  }

  return results;
}

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
