'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useTranslations }     from 'next-intl';
import { Suspense, useState, useRef, useEffect } from 'react';
import Image                  from 'next/image';
import { Link } from '@/i18n/navigation';

function Content() {
  const { data: session, status } = useSession();
  const t = useTranslations('auth');
  const tp = useTranslations('profile');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi bấm ngoài
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (status === 'loading') return <div className="text-xs text-gray-300">...</div>;

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
      >
        {t('signIn')}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Avatar - bấm mở dropdown */}
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
        {session.user.image ? (
          <Image src={session.user.image} alt={session.user.name ?? 'Avatar'}
            width={24} height={24} className="rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
            {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
          </div>
        )}
        <span className="text-xs text-gray-600 max-w-[80px] truncate hidden md:block">
          {session.user.name ?? session.user.email}
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
          <Link href="/profile" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            {tp('title')}
          </Link>
          <Link href="/profile" onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50">
            {tp('savedDeals')}
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-50">
            {tp('logout')}
          </button>
        </div>
      )}
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
