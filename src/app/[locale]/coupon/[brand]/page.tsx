/**
 * SEO COUPON PAGE — target từ khoá "[brand] coupon"
 * URL: /en/coupon/namecheap, /en/coupon/nordvpn...
 * Title động + JSON-LD FAQPage + FAQ section + trust signals
 */
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { VoucherCard } from '@/components/voucher/VoucherCard';
import { VoucherComments } from '@/components/voucher/VoucherComments';
import type { Voucher } from '@/types/voucher';
import { ShareButtons } from '@/components/share/ShareButtons';

// Trang gọi DB → render động lúc request, không pre-render lúc build
export const revalidate = 300; // ISR: cache & tự làm mới mỗi 5 phút

type Props = { params: Promise<{ locale: string; brand: string }> };

function prettyName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, brand } = await params;
  const name = prettyName(brand);
  const year = new Date().getFullYear();

  const count = await prisma.voucher.count({
    where: { provider: { equals: name, mode: 'insensitive' }, isActive: true },
  });

  const tm = await getTranslations({ locale, namespace: 'couponBrand' });
  const title = count > 0
    ? tm('metaTitleWorking', { name, count, year })
    : tm('metaTitle', { name, year });

  const description = tm('metaDescription', { name, year });

  return {
    title,
    description,
    keywords: [
      `${name} coupon`, `${name} coupon code`, `${name} promo code`,
      `${name} discount`, `${name} deals`, `${name} ${year}`,
    ].join(', '),
    // canonical + hreflang do [locale]/layout.tsx lo tập trung (set ở đây = ghi đè, mất hreflang)
    openGraph: {
      title, description, type: 'website',
      url: `https://dealeg.com/${locale}/coupon/${brand}`,
    },
  };
}

export default async function CouponPage({ params }: Props) {
  const { locale, brand } = await params;
  const name = prettyName(brand);
  const year = new Date().getFullYear();
  const t = await getTranslations({ locale, namespace: 'couponBrand' });

  const dbVouchers = await prisma.voucher.findMany({
    where: { provider: { equals: name, mode: 'insensitive' }, isActive: true },
    include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
    orderBy: [{ isVerified: 'desc' }, { discountValue: 'desc' }],
  });

  if (dbVouchers.length === 0) notFound();

  const vouchers: Voucher[] = dbVouchers.map((v: (typeof dbVouchers)[number]) => ({
    id:            v.id,
    provider:      v.provider,
    category:      v.category.toLowerCase() as 'domain',
    code:          v.code,
    hideCode:      v.hideCode,
    title:         (v.translations.find((tr: {locale:string}) => tr.locale === locale) ?? v.translations.find((tr: {locale:string}) => tr.locale === 'en'))?.title || '',
    description:   (v.translations.find((tr: {locale:string}) => tr.locale === locale) ?? v.translations.find((tr: {locale:string}) => tr.locale === 'en'))?.description || v.discount,
    discount:      v.discount,
    discountType:  'percentage' as const,
    discountValue: v.discountValue ?? 0,
    expiresAt:     v.expiresAt ?? undefined,
    isVerified:    v.isVerified,
    usedCount:     v.useCount,
    affiliateUrl:  v.affiliateUrl ?? '#',
    sourceUrl:     v.sourceUrl ?? undefined,
    createdAt:     v.createdAt,
    updatedAt:     v.updatedAt,
  }));

  const verifiedCount = vouchers.filter(v => v.isVerified).length;
  const bestDiscount  = Math.max(...vouchers.map(v => v.discountValue));

  const faqs = [
    { q: t('q1', { name }), a: t('a1', { name, verified: verifiedCount }) },
    { q: t('q2', { name }), a: t('a2', { name, best: bestDiscount }) },
    { q: t('q3', { name }), a: t('a3', { name }) },
    { q: t('q4', { name }), a: t('a4', { name }) },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: t('h1', { name, year }),
        description: t('metaDescription', { name, year }),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            {t('h1', { name, year })}
          </h1>
          <p className="text-gray-600 leading-relaxed">
            {t.rich('intro', {
              name, count: vouchers.length, verified: verifiedCount, best: bestDiscount,
              b: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </header>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-green-600 font-semibold">
            {t('verifiedCodes', { count: verifiedCount })}
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 font-semibold">
            {t('totalOffers', { count: vouchers.length })}
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            {t('updated', { date: new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' }) })}
          </div>
        </div>

        <section className="space-y-4">
          {vouchers.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <VoucherCard voucher={v} />
              <div className="px-5 pb-4">
                <VoucherComments voucherId={v.id} />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">{t('faqTitle', { name })}</h2>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <summary className="font-medium text-gray-900 cursor-pointer">{f.q}</summary>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Chia sẻ trang coupon */}
        <div className="pt-6 border-t border-gray-100">
          <ShareButtons title={`${name} coupon codes`} />
        </div>
      </div>
    </>
  );
}
