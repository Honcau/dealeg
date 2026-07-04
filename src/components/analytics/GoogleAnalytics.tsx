'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 — dùng next/script để load tối ưu.
 * Chỉ chạy khi có GA_ID trong env (không có thì không render gì).
 *
 * Đặt GA_MEASUREMENT_ID vào .env.production:
 *   NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
 * (phải có tiền tố NEXT_PUBLIC_ để client đọc được)
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Không có ID → không load gì (dev mode hoặc chưa cấu hình)
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
