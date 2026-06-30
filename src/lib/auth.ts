import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * Server-side: lấy session hiện tại
 * Dùng trong Server Components hoặc API routes
 */
export async function getSession() {
  return await auth();
}

/**
 * Client-side helper — được export để dùng trong 'use client' components
 * (thực tế client component sẽ gọi API /api/auth/session)
 */
export async function getClientSession() {
  const res  = await fetch('/api/auth/session');
  return await res.json();
}
