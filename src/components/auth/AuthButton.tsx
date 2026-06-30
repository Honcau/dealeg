'use client';

import { useSession, signIn } from 'next-auth/react';
import { Suspense }           from 'react';
import Image                  from 'next/image';
import Link                   from 'next/link';

function Content() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div className="text-xs text-gray-300">...</div>;

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        Đăng nhập
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? 'Avatar'}
            width={24} height={24}
            className="rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
            {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
          </div>
        )}
        <span className="text-xs text-gray-600 max-w-[80px] truncate hidden md:block">
          {session.user.name ?? session.user.email}
        </span>
      </Link>
    </div>
  );
}

export function AuthButton() {
  return (
    <Suspense fallback={<div className="text-xs text-gray-300">...</div>}>
      <Content />
    </Suspense>
  );
}
