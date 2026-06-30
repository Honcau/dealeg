/**
 * TRANSLATION SERVICE
 * - DeepL: EN ZH DE FR ES PT RU JA KO (chất lượng cao)
 * - Google: HI AR VI (DeepL không hỗ trợ tốt)
 * - Cache trong DB, không dịch lại nếu đã có
 */

// Ngôn ngữ DeepL hỗ trợ tốt
const DEEPL_LOCALES = new Set(['en','zh','de','fr','es','pt','ru','ja','ko']);

// Mapping locale → mã ngôn ngữ API
const DEEPL_LANG: Record<string, string> = {
  en: 'EN', zh: 'ZH', de: 'DE', fr: 'FR',
  es: 'ES', pt: 'PT', ru: 'RU', ja: 'JA', ko: 'KO',
};

const GOOGLE_LANG: Record<string, string> = {
  vi: 'vi', hi: 'hi', ar: 'ar',
  // fallback cho mọi locale còn lại
  en: 'en', zh: 'zh-CN', de: 'de', fr: 'fr',
  es: 'es', pt: 'pt', ru: 'ru', ja: 'ja', ko: 'ko',
};

// ── DeepL ─────────────────────────────────────────────────────────────────────
async function translateDeepL(text: string, targetLang: string): Promise<string> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error('DEEPL_API_KEY chưa set');

  // Free API dùng api-free.deepl.com, Pro dùng api.deepl.com
  const isFree = apiKey.endsWith(':fx');
  const host   = isFree ? 'api-free.deepl.com' : 'api.deepl.com';

  const res = await fetch(`https://${host}/v2/translate`, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      text:         [text],
      target_lang:  targetLang,
      preserve_formatting: true,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`DeepL error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.translations[0].text as string;
}

// ── Google Translate ───────────────────────────────────────────────────────────
async function translateGoogle(text: string, targetLang: string): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY chưa set');

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q:      text,
      target: targetLang,
      format: 'html', // giữ nguyên HTML tags
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`Google Translate error ${res.status}`);
  const data = await res.json();
  return data.data.translations[0].translatedText as string;
}

// ── Main export ───────────────────────────────────────────────────────────────
export interface TranslateResult {
  text:   string;
  engine: 'deepl' | 'google';
}

/**
 * Dịch text sang locale chỉ định.
 * Tự chọn DeepL hoặc Google tùy ngôn ngữ.
 */
export async function translateText(
  text:       string,
  targetLocale: string,
): Promise<TranslateResult> {
  if (!text.trim()) return { text, engine: 'deepl' };

  if (DEEPL_LOCALES.has(targetLocale) && process.env.DEEPL_API_KEY) {
    const translated = await translateDeepL(text, DEEPL_LANG[targetLocale]);
    return { text: translated, engine: 'deepl' };
  }

  // Fallback Google
  const translated = await translateGoogle(text, GOOGLE_LANG[targetLocale] ?? targetLocale);
  return { text: translated, engine: 'google' };
}

/**
 * Dịch một bài viết sang tất cả locales còn thiếu.
 * sourceLocale: ngôn ngữ gốc (thường 'vi' hoặc 'en')
 * Trả về map locale → { title, excerpt, content, engine }
 */
export async function translatePost(params: {
  title:        string;
  excerpt:      string;
  content:      string;
  sourceLocale: string;
  targetLocales: string[];
}): Promise<Record<string, { title: string; excerpt: string; content: string; engine: string }>> {
  const { title, excerpt, content, targetLocales } = params;
  const results: Record<string, { title: string; excerpt: string; content: string; engine: string }> = {};

  // Dịch song song (throttle 3 cùng lúc để tránh rate limit)
  const BATCH_SIZE = 3;

  for (let i = 0; i < targetLocales.length; i += BATCH_SIZE) {
    const batch = targetLocales.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (locale) => {
      try {
        // Dịch title, excerpt, content song song cho cùng 1 locale
        const [t, e, c] = await Promise.all([
          translateText(title,   locale),
          translateText(excerpt, locale),
          translateText(content, locale),
        ]);

        results[locale] = {
          title:   t.text,
          excerpt: e.text,
          content: c.text,
          engine:  t.engine,
        };
        console.log(`  ✓ ${locale} (${t.engine})`);
      } catch (err) {
        console.error(`  ✗ ${locale}: ${err}`);
      }
    }));

    // Dừng 500ms giữa các batch
    if (i + BATCH_SIZE < targetLocales.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

/** Đếm ký tự để ước tính chi phí */
export function countChars(title: string, excerpt: string, content: string): number {
  return (title + excerpt + content).length;
}
