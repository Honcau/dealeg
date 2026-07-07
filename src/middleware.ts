import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Map quốc gia (ISO country code) → ngôn ngữ phù hợp.
// Chỉ map các nước có ngôn ngữ Dealeg hỗ trợ; nước khác → để next-intl tự xử lý (Accept-Language).
const COUNTRY_TO_LOCALE: Record<string, string> = {
  VN: 'vi',
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
  IN: 'hi',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
  BR: 'pt', PT: 'pt',
  FR: 'fr', BE: 'fr',
  DE: 'de', AT: 'de',
  SA: 'ar', AE: 'ar', EG: 'ar', IQ: 'ar', MA: 'ar', DZ: 'ar',
  RU: 'ru', BY: 'ru', KZ: 'ru',
  JP: 'ja',
  KR: 'ko',
};

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Chỉ can thiệp khi user vào gốc "/" (chưa có prefix ngôn ngữ)
  // và CHƯA từng chọn ngôn ngữ (không có cookie NEXT_LOCALE).
  const hasLocaleCookie = req.cookies.has('NEXT_LOCALE');
  const isRoot = pathname === '/';

  if (isRoot && !hasLocaleCookie) {
    const country = req.headers.get('cf-ipcountry')?.toUpperCase();
    const suggested = country ? COUNTRY_TO_LOCALE[country] : null;

    if (suggested && suggested !== routing.defaultLocale) {
      // Chuyển tới ngôn ngữ gợi ý theo IP. KHÔNG set cookie —
      // để next-intl set khi user thực sự tương tác, và user đổi tay vẫn thắng.
      const url = req.nextUrl.clone();
      url.pathname = `/${suggested}`;
      return NextResponse.redirect(url);
    }
  }

  // Mọi trường hợp khác: next-intl xử lý bình thường
  // (bao gồm Accept-Language fallback khi không có cf-ipcountry, ví dụ chạy local)
  return intlMiddleware(req);
}

export const config = {
  // Loại trừ: api, _next, _vercel, admin, auth, file tĩnh
  matcher: ['/((?!api|_next|_vercel|admin|auth|.*\\..*).*)'],
};
