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
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Link } from '@/i18n/navigation';
import { VoucherDetailCard } from '@/components/voucher/VoucherDetailCard';
import { VoucherComments } from '@/components/voucher/VoucherComments';
import { ShareButtons } from '@/components/share/ShareButtons';
import { maskVoucherCode } from '@/lib/utils';
import type { Voucher } from '@/types/voucher';

export const revalidate = 300; // ISR: cache & tự làm mới mỗi 5 phút

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const v = await prisma.voucher.findUnique({
    where: { id },
    include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
  });
  const tMeta = await getTranslations({ locale, namespace: 'provider' });
  if (!v) return { title: tMeta('notFound') };

  const tr = v.translations.find(t => t.locale === locale) ?? v.translations.find(t => t.locale === 'en');
  const discountLabel = v.discountValue ? `${v.discountValue}% off` : v.discount;
  // Deal ẩn mã: không lộ mã đầy đủ ra title/description (SEO, tab trình duyệt)
  const codeLabel = v.hideCode ? maskVoucherCode(v.code) : v.code;
  const title = `${v.provider} ${discountLabel} - ${codeLabel} | Dealeg`;
  const description = tr?.description || `Get ${discountLabel} at ${v.provider} with code ${codeLabel}. Verified and updated on Dealeg.`;

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

  const tv = await getTranslations({ locale, namespace: 'voucher' });
  const tr = v.translations.find(t => t.locale === locale) ?? v.translations.find(t => t.locale === 'en');

  const voucher: Voucher = {
    id:            v.id,
    provider:      v.provider,
    category:      v.category.toLowerCase() as 'domain',
    code:          v.code,
    hideCode:      v.hideCode,
    title:         tr?.title || '',
    description:   tr?.description || v.discount,
    discount:      v.discount,
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
  // Mã hiển thị ngoài card (breadcrumb, share): che nếu là deal ẩn mã
  const codeLabel = v.hideCode ? maskVoucherCode(v.code) : v.code;

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600">{tv('home')}</Link>
          {' / '}
          <Link href={`/coupon/${providerSlug}`} className="hover:text-gray-600">{v.provider}</Link>
          {' / '}
          <span className="text-gray-600">{codeLabel}</span>
        </nav>

        {/* Card chi tiết chính */}
        <VoucherDetailCard voucher={voucher} />

        {/* Chia sẻ */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <ShareButtons title={`${v.provider} ${v.discount} - code ${codeLabel}`} />
        </div>

        {/* Bình luận + vote */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <VoucherComments voucherId={v.id} />
        </div>

        {/* Deal khác cùng provider */}
        {related.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
              {tv('moreDeals', { provider: v.provider })}
            </h2>
            <div className="space-y-2">
              {related.map(r => (
                <Link
                  key={r.id}
                  href={`/voucher/${r.id}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-sm text-gray-800">{r.hideCode ? maskVoucherCode(r.code) : r.code}</span>
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
