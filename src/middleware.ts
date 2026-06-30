import createMiddleware from 'next-intl/middleware';
import { routing }      from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Loại trừ: api, _next, _vercel, admin, auth, file tĩnh
  matcher: ['/((?!api|_next|_vercel|admin|auth|.*\\..*).*)'],
  //                                              ^^^^^ thêm vào
};
