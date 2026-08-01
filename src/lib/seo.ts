import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';

const BASE = 'https://dealeg.com';

// x-default (bản hiện khi trình duyệt không khớp ngôn ngữ nào) → tiếng Anh: rộng
// nhất cho khối URL quốc tế Google đang khám phá. defaultLocale của app là 'vi'
// (thị trường chính) nhưng với hreflang x-default, 'en' phủ được nhiều người hơn.
const X_DEFAULT = 'en';

const LOCALE_SET = new Set<string>(routing.locales);

/** '/en/category/hosting' → '/category/hosting' · '/en' → '' · '/' → '' */
export function stripLocale(pathname: string): string {
  const seg = pathname.split('/').filter(Boolean);
  if (seg.length && LOCALE_SET.has(seg[0])) seg.shift();
  return seg.length ? '/' + seg.join('/') : '';
}

/**
 * canonical tự trỏ + hreflang cho ĐÚNG trang này ở mọi locale + x-default.
 * `path` KHÔNG kèm tiền tố locale (VD '/category/hosting', '' = trang chủ).
 * `locales` để giới hạn tập ngôn ngữ (VD bài blog chỉ liệt kê locale đã dịch thật).
 */
export function buildAlternates(
  locale: string,
  path: string = '',
  locales: readonly string[] = routing.locales,
): NonNullable<Metadata['alternates']> {
  const p = path && !path.startsWith('/') ? '/' + path : path;
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${BASE}/${loc}${p}`;
  if (locales.includes(X_DEFAULT)) languages['x-default'] = `${BASE}/${X_DEFAULT}${p}`;
  return { canonical: `${BASE}/${locale}${p}`, languages };
}
