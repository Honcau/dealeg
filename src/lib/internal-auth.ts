import { timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Auth cho các route /api/internal/* — chỉ dành cho service nội bộ (bot).
 * Dùng Bearer token dùng chung (INTERNAL_API_TOKEN), so sánh constant-time.
 * Nhờ vậy bot KHÔNG cần credential DB, chỉ cần 1 token HTTP.
 */
export function checkInternalAuth(req: NextRequest): boolean {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected) return false;               // chưa cấu hình → chặn hết

  const header = req.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
