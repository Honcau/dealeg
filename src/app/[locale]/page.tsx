/**
 * TRANG CHỦ — dùng DB thật (Prisma + Supabase)
 * Thay thế mock data bằng query thực
 */
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { prisma }          from '@/lib/db';
import { VoucherGrid }     from '@/components/voucher/VoucherGrid';
import type { Voucher }    from '@/types/voucher';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return { title: t('hero.title') };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('home');

  // Lấy 12 voucher nổi bật nhất từ DB
  const dbVouchers = await prisma.voucher.findMany({
    where:   { isActive: true },
    include: { translations: { where: { locale } } },
    orderBy: [{ useCount: 'desc' }, { discountValue: 'desc' }],
    take: 12,
  });

  // Map Prisma model → app Voucher type
  const vouchers: Voucher[] = dbVouchers.map(v => ({
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
    <div className="space-y-14">
      {/* Hero */}
      <section className="text-center py-14 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          {t('hero.subtitle')}
        </p>
        <a
          href="#deals"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-7 py-3 rounded-xl transition-all"
        >
          {t('hero.cta')}
        </a>
      </section>

      {/* Featured deals */}
      <section id="deals">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-5">
          {t('featured')}
        </h2>
        <VoucherGrid vouchers={vouchers} />
      </section>
    </div>
  );
}
