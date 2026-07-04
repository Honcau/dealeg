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

  // 3. Coupon index + category pages
  const categories = ['domain', 'hosting', 'vpn', 'security', 'email', 'cdn', 'ssl', 'other'];
  for (const locale of routing.locales) {
    entries.push({
      url: `${BASE}/${locale}/coupon`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    });
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
