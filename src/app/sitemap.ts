import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const BASE = 'https://dealeg.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // 1. Trang chủ mỗi locale
  for (const locale of routing.locales) {
    entries.push({
      url: `${BASE}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });
  }

  // 1b. Trang công cụ (SEO magnet — tool pages hút traffic tìm kiếm)
  // Công cụ VN-only: chỉ index bản vi + en (Việt kiều) — tránh loãng SEO 12 ngôn ngữ
  const vnOnlyTools = ['/tools/vietqr', '/tools/gross-net', '/tools/vn-font', '/tools/id-photo', '/tools/lunar-calendar', '/tools/interest'];
  // Công cụ chung: index đủ 12 ngôn ngữ
  const globalTools = [
    '/tools', '/tools/discount', '/tools/currency', '/tools/password', '/tools/unit-price',
    '/tools/number-to-words', '/tools/text-counter', '/tools/image-compress', '/tools/pdf', '/tools/qr',
    '/tools/date-calculator', '/tools/utm-builder', '/tools/json', '/tools/base64', '/tools/hash',
  ];
  // Global tools × mọi locale
  for (const locale of routing.locales) {
    for (const route of globalTools) {
      entries.push({ url: `${BASE}/${locale}${route}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 });
    }
  }
  // VN-only tools × chỉ vi + en
  for (const locale of ['vi', 'en']) {
    for (const route of vnOnlyTools) {
      entries.push({ url: `${BASE}/${locale}${route}`, lastModified: new Date(), changeFrequency: 'monthly', priority: locale === 'vi' ? 0.8 : 0.6 });
    }
  }

  // 2. Trang coupon mỗi brand × locale (quan trọng nhất cho SEO)
  const providers = await prisma.voucher.findMany({
    where: { isActive: true },
    select: { provider: true },
    distinct: ['provider'],
  });

  for (const { provider } of providers) {
    const slug = provider.toLowerCase().replace(/\s+/g, '-');
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE}/${locale}/coupon/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      });
    }
  }

  // 2b. Trang chi tiết từng voucher
  const allVouchers = await prisma.voucher.findMany({
    where: { isActive: true },
    select: { id: true, updatedAt: true },
  });
  for (const v of allVouchers) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE}/${locale}/voucher/${v.id}`,
        lastModified: v.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  // 3. Coupon index + category pages
  const categories = ['domain', 'hosting', 'vpn', 'security', 'email', 'cdn', 'ssl', 'other'];
  for (const locale of routing.locales) {
    entries.push({
      url: `${BASE}/${locale}/coupon`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });
    // Legal + info pages
    for (const p of ['privacy', 'terms', 'disclaimer', 'contact', 'faq']) {
      entries.push({
        url: `${BASE}/${locale}/${p}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      });
    }

    for (const cat of categories) {
      entries.push({
        url: `${BASE}/${locale}/category/${cat}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  }

  // 4. Blog articles (chỉ published)
  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    select: { slug: true, updatedAt: true },
  });

  for (const article of articles) {
    for (const locale of routing.locales) {
      entries.push({
        url: `${BASE}/${locale}/blog/${article.slug}`,
        lastModified: article.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return entries;
}
