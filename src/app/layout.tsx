import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';   // ← PHẢI import ở đây để Tailwind load cho mọi route

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'vietnamese', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dealeg',
  description: 'Best tech vouchers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={inter.variable}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-gray-50 text-gray-900 antialiased font-sans"
      >
        {children}
      </body>
    </html>
  );
}
