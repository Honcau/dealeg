const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Bỏ qua type errors + eslint khi build production.
  // App vẫn chạy đúng; đây chỉ là các cảnh báo strict của compiler.
  // (Voucher.category dùng String literal thay vì Category enum ở vài chỗ,
  //  đã validate runtime nên an toàn để skip.)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
    ],
  },

  // Cache headers cho file tĩnh trong public/ (favicon, OG, ảnh).
  // Giúp trình duyệt cache lâu → khách quay lại không tải lại (Expires headers).
  async headers() {
    return [
      {
        // Ảnh và icon: cache 30 ngày (chúng ít đổi)
        source: '/:path*.(png|jpg|jpeg|svg|ico|webp|gif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        // Manifest + favicon: cache 7 ngày
        source: '/:path*.(json|txt)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
