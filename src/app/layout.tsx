import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'vietnamese', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

const SITE_URL = 'https://dealeg.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Dealeg - Best Tech Deals & Coupon Codes',
    template: '%s | Dealeg',
  },
  description: 'Find verified coupon codes and deals for hosting, VPN, domains, software, and online tools. Updated daily, available in 12 languages.',
  applicationName: 'Dealeg',
  keywords: ['coupon codes', 'deals', 'discounts', 'hosting coupons', 'VPN deals', 'domain coupons', 'software discounts'],

  // Favicon các loại
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',

  // Open Graph (Facebook, Zalo, LinkedIn...)
  openGraph: {
    type: 'website',
    siteName: 'Dealeg',
    title: 'Dealeg - Best Tech Deals & Coupon Codes',
    description: 'Verified coupon codes and deals for hosting, VPN, domains, and software. Updated daily, in 12 languages.',
    url: SITE_URL,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Dealeg - Best Tech Deals & Coupon Codes',
      },
    ],
  },

  // Twitter/X card
  twitter: {
    card: 'summary_large_image',
    title: 'Dealeg - Best Tech Deals & Coupon Codes',
    description: 'Verified coupon codes and deals for hosting, VPN, domains, and software.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={inter.variable}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-gray-50 text-gray-900 antialiased font-sans"
      >
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
