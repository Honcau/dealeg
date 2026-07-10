import { createHmac, timingSafeEqual } from 'crypto';
import { cookies }    from 'next/headers';
import { redirect }   from 'next/navigation';

const COOKIE_NAME = 'dealeg_admin';

/** Tạo token từ ADMIN_SECRET — không lưu secret thô trong cookie */
export function getAdminToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error('ADMIN_SECRET chưa được set trong .env');
  return createHmac('sha256', secret).update('dealeg-admin-v1').digest('hex');
}

/** So sánh chuỗi bí mật kiểu constant-time để tránh timing attack */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Kiểm tra cookie hợp lệ — dùng trong Server Components và layout */
export async function requireAdmin(): Promise<void> {
  const cookieStore = await cookies();
  const token       = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !safeEqual(token, getAdminToken())) {
    redirect('/admin/login');
  }
}

export { COOKIE_NAME };
