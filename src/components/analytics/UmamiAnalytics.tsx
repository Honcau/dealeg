'use client';

import Script from 'next/script';

/**
 * Umami — analytics riêng tư, cookieless (self-hosted trên analytics.dealeg.com).
 * Chạy SONG SONG với Google Analytics (không thay thế). Chỉ load khi có đủ 2 biến
 * env — không có thì không render gì (lúc dev, hoặc trước khi tạo website Umami).
 *
 * .env.production (tiền tố NEXT_PUBLIC_ để client đọc được → nhúng LÚC BUILD):
 *   NEXT_PUBLIC_UMAMI_SRC="https://analytics.dealeg.com/script.js"
 *   NEXT_PUBLIC_UMAMI_WEBSITE_ID="<Website ID copy từ dashboard Umami>"
 *
 * WEBSITE_ID chỉ có sau khi tạo website trong Umami → điền rồi rebuild app
 * (deploy.sh) để script được nhúng. Xem UMAMI_SETUP.md.
 */
export function UmamiAnalytics() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  // Thiếu cấu hình → không load gì
  if (!src || !websiteId) return null;

  return (
    <Script
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  );
}
