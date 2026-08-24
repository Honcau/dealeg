/**
 * DỊCH BÀI VIẾT — dùng LÕI DỊCH DÙNG CHUNG ở src/lib/deepl.ts (pool key + tự xoay).
 * File này chỉ còn phần riêng của bài viết: chọn locale cần dịch (bỏ qua cái đã có
 * để khỏi tốn quota) + lưu ArticleTranslation.
 */
import { prisma } from '@/lib/db';
import { translateTexts } from '@/lib/deepl';
import { TARGET_LOCALES } from '@/lib/deepl-langs';

export interface TranslateResult {
  locale:  string;
  success: boolean;
  error?:  string;
}

/**
 * Dịch bài (nguồn 'en') sang các locale CHƯA có bản mới hơn nguồn.
 * Locale đã dịch (updatedAt > bản 'en') được bỏ qua để không tốn quota khi chạy lại.
 */
export async function translateArticle(articleId: string): Promise<TranslateResult[]> {
  const source = await prisma.articleTranslation.findUnique({
    where: { articleId_locale: { articleId, locale: 'en' } },
  });
  if (!source) throw new Error('Cần có bản tiếng Anh trước khi dịch');

  const existing = await prisma.articleTranslation.findMany({
    where:  { articleId },
    select: { locale: true, updatedAt: true },
  });
  const upToDate = new Set(existing.filter(e => e.updatedAt > source.updatedAt).map(e => e.locale));

  const results: TranslateResult[] = [];
  for (const locale of TARGET_LOCALES) {
    if (upToDate.has(locale)) results.push({ locale, success: true });   // đã có, bỏ qua
  }

  const needed = TARGET_LOCALES.filter(l => !upToDate.has(l));
  const translated = await translateTexts([source.title, source.excerpt ?? '', source.content], needed);

  for (const r of translated) {
    if (r.success && r.texts) {
      const [title, excerpt, content] = r.texts;
      await prisma.articleTranslation.upsert({
        where:  { articleId_locale: { articleId, locale: r.locale } },
        create: { articleId, locale: r.locale, title, excerpt, content, isAutoTranslated: true, translatedAt: new Date() },
        update: { title, excerpt, content, isAutoTranslated: true, translatedAt: new Date() },
      });
      results.push({ locale: r.locale, success: true });
    } else {
      results.push({ locale: r.locale, success: false, error: r.error });
    }
  }

  return results;
}

/** Lấy bản dịch của bài theo locale; không có thì fallback bản 'en' (isFallback=true). */
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
