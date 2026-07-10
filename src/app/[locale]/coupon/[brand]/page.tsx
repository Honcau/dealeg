/**
 * SEO COUPON PAGE — target từ khoá "[brand] coupon"
 * URL: /en/coupon/namecheap, /en/coupon/nordvpn...
 * Title động + JSON-LD FAQPage + FAQ section + trust signals
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { VoucherCard } from '@/components/voucher/VoucherCard';
import { VoucherComments } from '@/components/voucher/VoucherComments';
import type { Voucher } from '@/types/voucher';
import { ShareButtons } from '@/components/share/ShareButtons';

// Trang gọi DB → render động lúc request, không pre-render lúc build
export const dynamic = 'force-dynamic';

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

  const title = count > 0
    ? `${name} Coupon Codes & Deals (${count} Working) - ${year}`
    : `${name} Coupon Codes & Promo Deals - ${year}`;

  const description = `Verified ${name} coupon codes and promo deals for ${year}. Save on ${name} with working discount codes, updated daily by our community.`;

  return {
    title,
    description,
    keywords: [
      `${name} coupon`, `${name} coupon code`, `${name} promo code`,
      `${name} discount`, `${name} deals`, `${name} ${year}`,
    ].join(', '),
    alternates: { canonical: `https://dealeg.com/${locale}/coupon/${brand}` },
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
    title:         (v.translations.find((tr: {locale:string}) => tr.locale === locale) ?? v.translations.find((tr: {locale:string}) => tr.locale === 'en'))?.title || '',
    description:   (v.translations.find((tr: {locale:string}) => tr.locale === locale) ?? v.translations.find((tr: {locale:string}) => tr.locale === 'en'))?.description || v.discount,
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
    {
      q: `Are these ${name} coupon codes working?`,
      a: `Yes. We have ${verifiedCount} verified ${name} coupon codes confirmed working by our community. Each code shows when it was last verified, and users vote on whether codes still work.`,
    },
    {
      q: `How much can I save with ${name} coupons?`,
      a: `Our best ${name} coupon currently offers up to ${bestDiscount}% off. Discounts vary by product and promotion, so check the full list above for the offer that fits your purchase.`,
    },
    {
      q: `How do I use a ${name} coupon code?`,
      a: `Copy the code from the list above, click through to ${name}, and paste the code at checkout in the promo code or coupon field. The discount applies before you complete payment.`,
    },
    {
      q: `How often are ${name} coupons updated?`,
      a: `We update ${name} coupons daily through automated checks and community submissions. Expired codes are removed and new offers are added as they become available.`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: `${name} Coupon Codes ${year}`,
        description: `Verified ${name} coupons and deals`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            {name} Coupon Codes & Deals ({year})
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Save on {name} with {vouchers.length} working coupon codes, including{' '}
            {verifiedCount} community-verified offers. Our best {name} discount is up to{' '}
            <strong>{bestDiscount}% off</strong>. All codes are updated daily and verified
            by real users — copy a code below and paste it at checkout.
          </p>
        </header>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-green-600">
            <span className="font-semibold">{verifiedCount}</span> verified codes
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="font-semibold">{vouchers.length}</span> total offers
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            Updated {new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })}
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
          <h2 className="text-xl font-bold text-gray-900">{name} Coupon FAQ</h2>
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
