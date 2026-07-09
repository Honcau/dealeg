'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LOCALE_LABELS: Record<Locale, string> = {
  vi: '🇻🇳 VI',
  en: '🇺🇸 EN',
  zh: '🇨🇳 中文',
  hi: '🇮🇳 हिं',
  es: '🇪🇸 ES',
  pt: '🇧🇷 PT',
  fr: '🇫🇷 FR',
  de: '🇩🇪 DE',
  ar: '🇸🇦 عر',
  ru: '🇷🇺 RU',
  ja: '🇯🇵 日本',
  ko: '🇰🇷 한국',
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.replace(pathname, { locale: e.target.value as Locale });
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="text-sm bg-transparent border border-gray-200 rounded-lg px-2 py-1.5 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      aria-label="Select language"
    >
      {routing.locales.map((loc) => (
        <option key={loc} value={loc}>
          {LOCALE_LABELS[loc]}
        </option>
      ))}
    </select>
  );
}
