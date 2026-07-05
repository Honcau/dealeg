'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';

interface NavLink {
  href: string;
  label: string;
}

export function MobileMenu({ navLinks, submitLabel }: { navLinks: NavLink[]; submitLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Nút hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 -mr-2 text-gray-600"
        aria-label="Menu"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Menu dropdown */}
      {open && (
        <>
          {/* Overlay đóng menu khi bấm ngoài */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <nav className="absolute top-14 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-lg">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-gray-700 hover:text-indigo-600 border-b border-gray-50 last:border-0 transition-colors"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/submit"
                onClick={() => setOpen(false)}
                className="mt-3 text-center text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                {submitLabel}
              </Link>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
