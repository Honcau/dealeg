const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },  // Google
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }, // GitHub
      { protocol: 'https', hostname: '*.fbcdn.net' },                 // Facebook
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' }, // Facebook
    ],
  },
};

module.exports = withNextIntl(nextConfig);
