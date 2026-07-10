/**
 * TRANG CHỦ — dùng DB thật (Prisma + Supabase)
 * Thay thế mock data bằng query thực
 */
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { prisma }          from '@/lib/db';
import { VoucherGrid }     from '@/components/voucher/VoucherGrid';
import type { Voucher }    from '@/types/voucher';
import { ShareButtons } from '@/components/share/ShareButtons';

// Trang gọi DB → render động lúc request, không pre-render lúc build
export const revalidate = 300; // ISR: cache & tự làm mới mỗi 5 phút

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
    include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
    orderBy: [{ useCount: 'desc' }, { discountValue: 'desc' }],
    take: 12,
  });

  // Map Prisma model → app Voucher type
  const vouchers: Voucher[] = dbVouchers.map((v: (typeof dbVouchers)[number]) => ({
    id:            v.id,
    provider:      v.provider,
    category:      v.category.toLowerCase() as 'domain',
    code:          v.code,
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
    <div className="space-y-14">
      {/* Hero — thuần typography, tối giản */}
      <section className="pt-16 pb-10 px-4 max-w-3xl">
        <h1 className="font-display text-4xl md:text-6xl font-bold text-gray-900 tracking-tight leading-[1.05] mb-5">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mb-8 leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <a
          href="#deals"
          className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-3 rounded-lg transition-colors text-sm"
        >
          {t('hero.cta')}
          <span aria-hidden>↓</span>
        </a>
      </section>

      {/* Featured deals */}
      <section id="deals">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-5">
          {t('featured')}
        </h2>
        <VoucherGrid vouchers={vouchers} />
      </section>

      <section className="pt-4 border-t border-gray-100">
        <ShareButtons title="Best tech deals & coupon codes - Dealeg" />
      </section>
    </div>
  );
}
