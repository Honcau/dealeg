/**
 * COUPON INDEX — liệt kê tất cả brand (internal linking cho SEO)
 * URL: /en/coupon
 */
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/db';
import { ShareButtons } from '@/components/share/ShareButtons';

// ISR: cache trang đã render, tự làm mới mỗi 5 phút (nhanh hơn nhiều so với render mỗi request)
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'coupon' });
  return { title: t('metaTitle'), description: t('metaDescription') };
}

export default async function CouponIndexPage({ params }: Props) {
  const { locale } = await params;
  const t    = await getTranslations({ locale, namespace: 'coupon' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const grouped = await prisma.voucher.groupBy({
    by: ['provider', 'category'],
    where: { isActive: true },
    _count: { _all: true },
    _max: { discountValue: true },
  });

  const byCategory = grouped.reduce(
    (acc: Record<string, { provider: string; slug: string; count: number; maxDiscount: number }[]>, g: (typeof grouped)[number]) => {
      const cat = String(g.category);
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({
        provider: g.provider,
        slug: g.provider.toLowerCase().replace(/\s+/g, '-'),
        count: g._count._all,
        maxDiscount: g._max.discountValue ?? 0,
      });
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
          {t('title')}
        </h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </header>

      {Object.entries(byCategory).map(([category, brands]) => (
        <section key={category}>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            {tNav.has(category.toLowerCase()) ? tNav(category.toLowerCase()) : category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {brands.sort((a, b) => b.maxDiscount - a.maxDiscount).map(brand => (
              <Link
                key={brand.slug}
                href={`/coupon/${brand.slug}`}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {brand.provider}
                  </span>
                  {brand.maxDiscount > 0 && (
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      -{brand.maxDiscount}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t('codesAvailable', { count: brand.count })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    <div className="pt-6 border-t border-gray-100 mt-8">
        <ShareButtons title="All coupon codes by brand - Dealeg" />
      </div>
    </div>
  );
}
