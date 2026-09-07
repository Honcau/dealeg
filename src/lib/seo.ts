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
  if (locales.includes(X_DEFAULT)) {
    // TRANG CHỦ: '/' tự chuyển hướng theo vị trí (middleware) → đúng định nghĩa
    // x-default của Google. Không khai báo thì Google thấy '/' là URL ngoài bộ
    // hreflang, trùng nội dung với /vi, rồi TỰ chọn '/' làm canonical — đúng lỗi
    // "Duplicate, Google chose different canonical than user" của /vi trong GSC.
    languages['x-default'] = p === '' ? `${BASE}/` : `${BASE}/${X_DEFAULT}${p}`;
  }
  return { canonical: `${BASE}/${locale}${p}`, languages };
}

/**
 * Trang CHỈ có bản tiếng Anh (privacy / terms / disclaimer): nội dung ở 12 locale là
 * y hệt nhau nên Google gom thành cụm trùng lặp ("Duplicate without user-selected
 * canonical"). Cho mọi locale trỏ canonical về /en/... để gộp 12 URL thành 1, và chỉ
 * khai báo hreflang en + x-default (khai đủ 12 thứ tiếng là mâu thuẫn: chúng không
 * thật sự là bản dịch khác nhau).
 */
export function buildEnglishOnlyAlternates(path: string): NonNullable<Metadata['alternates']> {
  const p = path && !path.startsWith('/') ? '/' + path : path;
  const url = `${BASE}/${X_DEFAULT}${p}`;
  return { canonical: url, languages: { [X_DEFAULT]: url, 'x-default': url } };
}
