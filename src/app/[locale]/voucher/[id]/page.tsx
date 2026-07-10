/**
 * TRANG CHI TIẾT VOUCHER
 * URL: /vi/voucher/[id]
 * - SEO đầy đủ (title động, OG, JSON-LD Offer)
 * - Nút "Nhận mã" (copy + mở affiliate)
 * - Nút chia sẻ (Facebook, Zalo, Telegram...)
 * - Bình luận + vote
 * - Link tới các deal khác cùng provider
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Link } from '@/i18n/navigation';
import { VoucherDetailCard } from '@/components/voucher/VoucherDetailCard';
import { VoucherComments } from '@/components/voucher/VoucherComments';
import { ShareButtons } from '@/components/share/ShareButtons';
import type { Voucher } from '@/types/voucher';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const v = await prisma.voucher.findUnique({
    where: { id },
    include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
  });
  if (!v) return { title: 'Voucher not found' };

  const tr = v.translations.find(t => t.locale === locale) ?? v.translations.find(t => t.locale === 'en');
  const discountLabel = v.discountValue ? `${v.discountValue}% off` : v.discount;
  const title = `${v.provider} ${discountLabel} - ${v.code} | Dealeg`;
  const description = tr?.description || `Get ${discountLabel} at ${v.provider} with code ${v.code}. Verified and updated on Dealeg.`;

  return {
    title,
    description,
    alternates: { canonical: `https://dealeg.com/${locale}/voucher/${id}` },
    openGraph: { title, description, type: 'website', url: `https://dealeg.com/${locale}/voucher/${id}` },
  };
}

export default async function VoucherDetailPage({ params }: Props) {
  const { locale, id } = await params;

  const v = await prisma.voucher.findUnique({
    where: { id },
    include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
  });
  if (!v) notFound();

  const tr = v.translations.find(t => t.locale === locale) ?? v.translations.find(t => t.locale === 'en');

  const voucher: Voucher = {
    id:            v.id,
    provider:      v.provider,
    category:      v.category.toLowerCase() as 'domain',
    code:          v.code,
    title:         tr?.title || '',
    description:   tr?.description || v.discount,
    discountType:  'percentage',
    discountValue: v.discountValue ?? 0,
    expiresAt:     v.expiresAt ?? undefined,
    isVerified:    v.isVerified,
    usedCount:     v.useCount,
    affiliateUrl:  v.affiliateUrl ?? '#',
    sourceUrl:     v.sourceUrl ?? undefined,
    createdAt:     v.createdAt,
    updatedAt:     v.updatedAt,
  };

  // Các deal khác cùng provider (gợi ý)
  const related = await prisma.voucher.findMany({
    where: {
      provider: v.provider,
      isActive: true,
      id: { not: v.id },
    },
    take: 4,
    orderBy: { discountValue: 'desc' },
  });

  const providerSlug = v.provider.toLowerCase().replace(/\s+/g, '-');

  // JSON-LD Offer schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: `${v.provider} - ${v.discount}`,
    description: voucher.description,
    seller: { '@type': 'Organization', name: v.provider },
    ...(v.expiresAt ? { priceValidUntil: v.expiresAt.toISOString().split('T')[0] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          {' / '}
          <Link href={`/coupon/${providerSlug}`} className="hover:text-gray-600">{v.provider}</Link>
          {' / '}
          <span className="text-gray-600">{v.code}</span>
        </nav>

        {/* Card chi tiết chính */}
        <VoucherDetailCard voucher={voucher} />

        {/* Chia sẻ */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <ShareButtons title={`${v.provider} ${v.discount} - code ${v.code}`} />
        </div>

        {/* Bình luận + vote */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <VoucherComments voucherId={v.id} />
        </div>

        {/* Deal khác cùng provider */}
        {related.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              More {v.provider} deals
            </h2>
            <div className="space-y-2">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/voucher/${r.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-gray-800">{r.code}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{r.discount}</p>
                  </div>
                  <span className="text-indigo-600 font-bold text-sm">
                    {r.discountValue ? `-${r.discountValue}%` : '→'}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
