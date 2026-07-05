'use client';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';

function getMsg(): string {
  if (typeof document === 'undefined') return 'Signing out...';
  const m = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  return m?.[1] === 'vi' ? 'Đang đăng xuất...' : 'Signing out...';
}

export default function SignOutPage() {
  useEffect(() => { signOut({ callbackUrl: '/' }); }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500 text-sm">{getMsg()}</p>
    </div>
  );
}
