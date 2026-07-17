import { getLocale, getTranslations } from 'next-intl/server';

/**
 * Banner cho 3 trang pháp lý (privacy / terms / disclaimer).
 *
 * Chúng CỐ Ý chỉ có bản tiếng Anh: văn bản pháp lý dịch lệch sắc thái là rủi ro thật,
 * và không ai kiểm chứng được 11 ngôn ngữ. Thay vì im lặng để user tự nhận ra,
 * ta nói thẳng — bằng chính ngôn ngữ của họ.
 *
 * Không hiện với user tiếng Anh: với họ trang vốn đã đúng ngôn ngữ, banner chỉ là nhiễu.
 */
export async function EnglishOnlyNotice() {
  const locale = await getLocale();
  if (locale === 'en') return null;

  const t = await getTranslations('legal');

  return (
    <div
      lang={locale}
      className="not-prose bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-8 text-sm"
    >
      {t('englishOnly')}
    </div>
  );
}
