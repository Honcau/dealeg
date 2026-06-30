/**
 * PROVIDER DETAIL PAGE
 * URL: /vi/provider/namecheap
 * Hiển thị: tất cả voucher của provider + comments + votes
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { VoucherCard } from '@/components/voucher/VoucherCard';
import { VoucherComments } from '@/components/voucher/VoucherComments';
import type { Voucher } from '@/types/voucher';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const provider = await prisma.provider.findUnique({
    where: { slug },
  });

  if (!provider) return { title: 'Không tìm thấy' };
  return {
    title: `${provider.name} Vouchers | Dealeg`,
    description: `Các voucher mới nhất cho ${provider.name}`,
  };
}

export default async function ProviderPage({ params }: Props) {
  const { locale, slug } = await params;

  // Tìm provider
  const provider = await prisma.provider.findUnique({
    where: { slug },
    include: {
      vouchers: {
        where: { isActive: true },
        include: { translations: { where: { locale } } },
        orderBy: { discountValue: 'desc' },
      },
    },
  });

  if (!provider || provider.vouchers.length === 0) {
    notFound();
  }

  // Map vouchers
  const vouchers: Voucher[] = provider.vouchers.map(v => ({
    id:            v.id,
    provider:      v.provider,
    category:      v.category.toLowerCase() as 'domain',
    code:          v.code,
    description:   v.translations[0]?.description ?? v.discount,
    discountType:  'percentage' as const,
    discountValue: v.discountValue ?? 0,
    expiresAt:     v.expiresAt ?? undefined,
    isVerified:    v.isVerified,
    usedCount:     v.useCount,
    affiliateUrl:  v.affiliateUrl ?? '#',
    createdAt:     v.createdAt,
    updatedAt:     v.updatedAt,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{provider.name}</h1>
        <p className="text-gray-500">
          {vouchers.length} voucher · <a href={provider.website} target="_blank" className="text-indigo-600 hover:underline">Visit site →</a>
        </p>
      </section>

      {/* Vouchers */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Active Deals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {vouchers.map(v => (
            <div key={v.id} className="space-y-2">
              <VoucherCard voucher={v} />
              {/* Comments section per voucher */}
              <div className="border-t border-gray-200 pt-2">
                <VoucherComments voucherId={v.id} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
