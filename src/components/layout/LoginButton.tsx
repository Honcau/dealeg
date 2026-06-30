'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <Image
            src={session.user.image} alt={session.user.name ?? 'User'}
            width={28} height={28}
            className="rounded-full border border-gray-200"
          />
        )}
        <button
          onClick={() => signOut()}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
    >
      Đăng nhập
    </button>
  );
}
