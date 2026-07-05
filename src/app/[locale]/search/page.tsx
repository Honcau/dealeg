import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import { Link } from '@/i18n/navigation';
import { VoucherGrid } from '@/components/voucher/VoucherGrid';
import type { Voucher } from '@/types/voucher';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q = '' } = await searchParams;
  return {
    title: q ? `Search: ${q} | Dealeg` : 'Search | Dealeg',
    robots: { index: false }, // trang kết quả search không cần index
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q = '' } = await searchParams;
  const t = await getTranslations('search');
  const query = q.trim();

  let vouchers: Voucher[] = [];
  let articles: { slug: string; title: string; excerpt: string }[] = [];

  if (query.length >= 2) {
    const [voucherRows, articleRows] = await Promise.all([
      prisma.voucher.findMany({
        where: {
          isActive: true,
          OR: [
            { provider: { contains: query, mode: 'insensitive' } },
            { code:     { contains: query, mode: 'insensitive' } },
            { discount: { contains: query, mode: 'insensitive' } },
            { translations: { some: { title:       { contains: query, mode: 'insensitive' } } } },
            { translations: { some: { description: { contains: query, mode: 'insensitive' } } } },
          ],
        },
        include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
        take: 30,
        orderBy: [{ useCount: 'desc' }, { discountValue: 'desc' }],
      }),
      prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { translations: { some: { title:   { contains: query, mode: 'insensitive' } } } },
            { translations: { some: { excerpt: { contains: query, mode: 'insensitive' } } } },
            { translations: { some: { content: { contains: query, mode: 'insensitive' } } } },
          ],
        },
        include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
        take: 20,
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    vouchers = voucherRows.map(v => {
      const tr = v.translations.find(x => x.locale === locale) ?? v.translations.find(x => x.locale === 'en');
      return {
        id: v.id, provider: v.provider,
        category: v.category.toLowerCase() as 'domain',
        code: v.code,
        description: tr?.description || v.discount,
        discountType: 'percentage',
        discountValue: v.discountValue ?? 0,
        expiresAt: v.expiresAt ?? undefined,
        isVerified: v.isVerified, usedCount: v.useCount,
        affiliateUrl: v.affiliateUrl ?? '#',
        sourceUrl: v.sourceUrl ?? undefined,
        createdAt: v.createdAt, updatedAt: v.updatedAt,
      };
    });

    articles = articleRows.map(a => {
      const tr = a.translations.find(x => x.locale === locale) ?? a.translations.find(x => x.locale === 'en');
      return { slug: a.slug, title: tr?.title || a.slug, excerpt: tr?.excerpt || '' };
    });
  }

  const total = vouchers.length + articles.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          {query ? t('resultsFor', { query }) : t('title')}
        </h1>
        {query && (
          <p className="text-sm text-gray-400 mt-1">{t('foundCount', { count: total })}</p>
        )}
      </div>

      {query.length < 2 && (
        <p className="text-gray-400">{t('typeToSearch')}</p>
      )}

      {query.length >= 2 && total === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-2">{t('noResultsFor', { query })}</p>
          <p className="text-sm text-gray-400">{t('tryDifferent')}</p>
        </div>
      )}

      {/* Voucher results */}
      {vouchers.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            {t('vouchers')} ({vouchers.length})
          </h2>
          <VoucherGrid vouchers={vouchers} />
        </section>
      )}

      {/* Article results */}
      {articles.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            {t('articles')} ({articles.length})
          </h2>
          <div className="space-y-3">
            {articles.map(a => (
              <Link
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                {a.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
