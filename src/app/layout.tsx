import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

/**
 * Font Inter — next/font tự tối ưu và self-host lúc build.
 * Trên VPS có internet, build sẽ tải font 1 lần và nhúng vào output.
 * fallback: system fonts nếu Inter chưa load.
 */
const inter = Inter({
  subsets: ['latin', 'latin-ext', 'vietnamese', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
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
