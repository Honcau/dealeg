import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { routing }          from './routing';
import enMessages           from '../../messages/en.json';

/**
 * Trộn key thiếu từ `base` vào `override` (đệ quy, không đụng object gốc).
 * Giá trị của `override` luôn thắng; `base` chỉ lấp chỗ trống.
 */
function deepMerge(base: AbstractIntlMessages, override: AbstractIntlMessages): AbstractIntlMessages {
  const out: AbstractIntlMessages = { ...base };
  for (const [k, v] of Object.entries(override)) {
    const b = out[k];
    out[k] =
      typeof v === 'object' && v !== null && typeof b === 'object' && b !== null
        ? deepMerge(b, v)
        : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Fallback về defaultLocale nếu không hợp lệ
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }

  const base = enMessages as AbstractIntlMessages;
  const localeMessages = (await import(`../../messages/${locale}.json`)).default as AbstractIntlMessages;

  /**
   * Lấy `en` làm nền rồi đè locale lên: key nào locale thiếu thì rơi về TIẾNG ANH.
   * Không có lớp này thì next-intl ném MISSING_MESSAGE (dev) hoặc in ra đường dẫn key
   * thô như "profile.languageHint" (prod) — nên code phải rải t.has() khắp nơi.
   *
   * ⚠️ CỐ Ý dùng `en`, KHÔNG dùng routing.defaultLocale: defaultLocale là 'vi', lấy nó
   * làm nền thì user Nhật thiếu key sẽ thấy TIẾNG VIỆT — đúng lớp bug đang đi sửa.
   */
  return {
    locale,
    messages: locale === 'en' ? base : deepMerge(base, localeMessages),
  };
});
