/**
 * Route non-localized /auth/signin (NextAuth pages.signIn trỏ vào đây).
 * Chuyển hướng sang trang đăng nhập ĐÃ i18n /[locale]/auth/signin theo cookie NEXT_LOCALE,
 * giữ nguyên query (callbackUrl, error...). Middleware loại trừ /auth nên route này chạy độc lập.
 */
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { routing } from '@/i18n/routing';

export default async function AuthSignInRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const store = await cookies();
  const cookieLocale = store.get('NEXT_LOCALE')?.value;
  const locale = cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale)
    ? cookieLocale
    : routing.defaultLocale;

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') qs.set(k, v);
    else if (Array.isArray(v) && typeof v[0] === 'string') qs.set(k, v[0]);
  }
  const query = qs.toString();

  redirect(`/${locale}/auth/signin${query ? `?${query}` : ''}`);
}
