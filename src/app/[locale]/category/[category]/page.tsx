/**
 * TRANG DANH MỤC ĐỘNG
 * URL: /vi/category/domain | /en/category/hosting | /ko/category/vpn
 */
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound }         from 'next/navigation';
import { prisma }           from '@/lib/db';
import { VoucherGrid }      from '@/components/voucher/VoucherGrid';
import { VoucherFilter }    from '@/components/voucher/VoucherFilter';
import type { Voucher }     from '@/types/voucher';

// Slug URL → giá trị enum trong DB (string để tránh import lỗi)
const VALID_CATEGORIES = ['domain','hosting','vpn','security','email','cdn','ssl','other'] as const;
type CategorySlug = typeof VALID_CATEGORIES[number];

type Props = {
  params:       Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ sort?: string; provider?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  const label = (t as (key: string) => string)(category) ?? category;
  return { title: `${label} Vouchers | Dealeg` };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category }                 = await params;
  const { sort = 'discount', provider } = await searchParams;

  // Validate: chỉ cho phép category hợp lệ
  const slug = category.toLowerCase() as CategorySlug;
  if (!VALID_CATEGORIES.includes(slug)) notFound();

  const dbCategory = slug.toUpperCase(); // 'domain' → 'DOMAIN'

  // Query DB
  const [dbVouchers, providerRows] = await Promise.all([
    prisma.voucher.findMany({
      where: {
        category: dbCategory,
        isActive: true,
        ...(provider ? { provider } : {}),
      },
      include: { translations: { take: 1 } },
      orderBy:
        sort === 'newest'  ? { createdAt:    'desc' } :
        sort === 'popular' ? { useCount:     'desc' } :
                             { discountValue:'desc' },   // default: % giảm nhiều nhất
      take: 48,
    }),
    prisma.voucher.findMany({
      where: { category: dbCategory, isActive: true },
      select: { provider: true },
      distinct: ['provider'],
    }),
  ]);

  // Map Prisma model → Voucher type
  const vouchers: Voucher[] = dbVouchers.map(v => ({
    id:            v.id,
    provider:      v.provider,
    category:      slug,
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
    <div className="space-y-6">
      <VoucherFilter
        currentSort={sort}
        currentProvider={provider}
        providers={providerRows.map(p => p.provider)}
        category={slug}
      />
      <VoucherGrid vouchers={vouchers} />
    </div>
  );
}
