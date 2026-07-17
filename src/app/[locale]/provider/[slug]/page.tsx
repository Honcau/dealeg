/**
 * PROVIDER DETAIL PAGE
 * URL: /vi/provider/namecheap
 * Hiển thị tất cả voucher của provider + comments + votes
 *
 * Lưu ý: Voucher.provider là String (không phải FK), nên query voucher
 * bằng cách match tên provider, không dùng Prisma relation.
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

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const provider = await prisma.provider.findUnique({ where: { slug } });
  const t = await getTranslations({ locale, namespace: 'provider' });
  if (!provider) return { title: t('notFound') };
  return {
    title: t('metaTitle', { name: provider.name }),
    description: t('metaDescription', { name: provider.name }),
  };
}

export default async function ProviderPage({ params }: Props) {
  const { locale, slug } = await params;

  const t = await getTranslations({ locale, namespace: 'provider' });

  // Tìm provider theo slug
  const provider = await prisma.provider.findUnique({ where: { slug } });
  if (!provider) notFound();

  // Query voucher riêng bằng cách match TÊN provider (không phải relation)
  const dbVouchers = await prisma.voucher.findMany({
    where: {
      provider: { equals: provider.name, mode: 'insensitive' },
      isActive: true,
    },
    include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
    orderBy: { discountValue: 'desc' },
  });

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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{provider.name}</h1>
        <p className="text-gray-500">
          {t('voucherCount', { count: vouchers.length })}
          {provider.website && <> · <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{t('visitSite')} →</a></>}
        </p>
        {provider.description && (
          <p className="text-gray-600 leading-relaxed max-w-2xl mt-4">{provider.description}</p>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
          {t('activeDeals')}
        </h2>
        {vouchers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vouchers.map(v => (
              <div key={v.id} className="space-y-2">
                <VoucherCard voucher={v} />
                <div className="border-t border-gray-200 pt-2">
                  <VoucherComments voucherId={v.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">{t('noDeals', { name: provider.name })}</p>
        )}
      </section>

      <div className="pt-6 border-t border-gray-100">
        <ShareButtons title={`${provider.name} coupons & deals - Dealeg`} />
      </div>
    </div>
  );
}
