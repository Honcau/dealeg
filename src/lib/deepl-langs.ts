/**
 * Hằng số ngôn ngữ DeepL — module THUẦN (không import prisma) để client component
 * (ArticleForm, ArticleEditor…) import được TARGET_LOCALES mà không kéo theo server code.
 */
export const DEEPL_LANG: Record<string, string> = {
  vi: 'VI', zh: 'ZH', hi: 'HI', es: 'ES', pt: 'PT-BR',
  fr: 'FR', de: 'DE', ar: 'AR', ru: 'RU', ja: 'JA', ko: 'KO',
};

/** 11 locale đích (không gồm 'en' — là ngôn ngữ nguồn). */
export const TARGET_LOCALES = Object.keys(DEEPL_LANG);
