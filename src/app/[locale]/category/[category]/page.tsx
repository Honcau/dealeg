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
import { ShareButtons } from '@/components/share/ShareButtons';

// Trang gọi DB → render động lúc request, không pre-render lúc build
export const dynamic = 'force-dynamic';

// Slug URL → giá trị enum trong DB (string để tránh import lỗi)
const VALID_CATEGORIES = ['domain','hosting','vps','vpn','security','email','cdn','ssl','aitool','other'] as const;
type CategorySlug = typeof VALID_CATEGORIES[number];

type Props = {
  params:       Promise<{ locale: string; category: string }>;
  searchParams: Promise<{ sort?: string; provider?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  const t  = await getTranslations({ locale, namespace: 'nav' });
  const tv = await getTranslations({ locale, namespace: 'voucher' });
  // nav giờ đủ 10 slug của VALID_CATEGORIES → không còn rơi về slug thô ("ssl Vouchers")
  const label = t.has(category) ? t(category) : category;

  // Category rỗng (0 deal) render trang trống → Google báo Soft 404. Đánh noindex để
  // thành "loại trừ có chủ đích" thay vì lỗi; tự index lại khi có deal.
  const dbCategory = category.toUpperCase() as any;
  const count = await prisma.voucher.count({
    where: { OR: [{ category: dbCategory }, { categories: { has: dbCategory } }], isActive: true },
  });

  return {
    title: `${label} ${tv('vouchers')} | Dealeg`,
    ...(count === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale, category }         = await params;
  const { sort = 'discount', provider } = await searchParams;

  // Validate: chỉ cho phép category hợp lệ
  const slug = category.toLowerCase() as CategorySlug;
  if (!VALID_CATEGORIES.includes(slug)) notFound();

  const dbCategory = slug.toUpperCase() as any; // 'domain' → 'DOMAIN'

  // Query DB
  const [dbVouchers, providerRows] = await Promise.all([
    prisma.voucher.findMany({
      where: {
        // voucher cũ chỉ có `category`; voucher mới có `categories[]` → khớp cả hai
        OR: [{ category: dbCategory }, { categories: { has: dbCategory } }],
        isActive: true,
        ...(provider ? { provider } : {}),
      },
      include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
      orderBy:
        sort === 'newest'  ? { createdAt:    'desc' } :
        sort === 'popular' ? { useCount:     'desc' } :
                             { discountValue:'desc' },   // default: % giảm nhiều nhất
      take: 48,
    }),
    prisma.voucher.findMany({
      where: {
        OR: [{ category: dbCategory }, { categories: { has: dbCategory } }],
        isActive: true,
      },
      select: { provider: true },
      distinct: ['provider'],
    }),
  ]);

  // Map Prisma model → Voucher type
  const vouchers: Voucher[] = dbVouchers.map((v: (typeof dbVouchers)[number]) => ({
    id:            v.id,
    provider:      v.provider,
    category:      slug,
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
    <div className="space-y-6">
      <VoucherFilter
        currentSort={sort}
        currentProvider={provider}
        providers={providerRows.map((p: (typeof providerRows)[number]) => p.provider)}
        category={slug}
      />
      <VoucherGrid vouchers={vouchers} />

      <div className="pt-6 border-t border-gray-100">
        <ShareButtons title={`${slug} deals & coupons - Dealeg`} />
      </div>
    </div>
  );
}
