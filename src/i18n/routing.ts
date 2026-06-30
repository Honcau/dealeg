import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['vi', 'en', 'zh', 'hi', 'es', 'pt', 'fr', 'de', 'ar', 'ru', 'ja', 'ko'],
  defaultLocale: 'vi',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];

// Locales that read right-to-left — used to set <html dir="rtl">
export const RTL_LOCALES: Locale[] = ['ar'];

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.includes(locale as Locale);
}
