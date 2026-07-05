import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/search?q=...&locale=vi
 * Tìm trong voucher (provider, code, mô tả) + bài viết (tiêu đề, nội dung).
 * Trả kết quả gọn để hiện dropdown gợi ý.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const locale = req.nextUrl.searchParams.get('locale') ?? 'vi';

  // Query quá ngắn → không tìm
  if (q.length < 2) {
    return NextResponse.json({ vouchers: [], articles: [] });
  }

  const [vouchers, articles] = await Promise.all([
    // Tìm voucher: theo provider, code, hoặc mô tả (trong translation)
    prisma.voucher.findMany({
      where: {
        isActive: true,
        OR: [
          { provider: { contains: q, mode: 'insensitive' } },
          { code:     { contains: q, mode: 'insensitive' } },
          { discount: { contains: q, mode: 'insensitive' } },
          { translations: { some: { title: { contains: q, mode: 'insensitive' } } } },
          { translations: { some: { description: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
      take: 6,
      orderBy: [{ useCount: 'desc' }, { discountValue: 'desc' }],
    }),

    // Tìm bài viết: theo tiêu đề hoặc nội dung (trong translation), chỉ PUBLISHED
    prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { translations: { some: { title:   { contains: q, mode: 'insensitive' } } } },
          { translations: { some: { excerpt: { contains: q, mode: 'insensitive' } } } },
          { translations: { some: { content: { contains: q, mode: 'insensitive' } } } },
        ],
      },
      include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
      take: 5,
      orderBy: { publishedAt: 'desc' },
    }),
  ]);

  // Format gọn cho client
  const voucherResults = vouchers.map(v => {
    const tr = v.translations.find(t => t.locale === locale) ?? v.translations.find(t => t.locale === 'en');
    return {
      id:       v.id,
      provider: v.provider,
      code:     v.code,
      discount: v.discount,
      discountValue: v.discountValue,
      title:    tr?.title || `${v.provider} ${v.discount}`,
    };
  });

  const articleResults = articles.map(a => {
    const tr = a.translations.find(t => t.locale === locale) ?? a.translations.find(t => t.locale === 'en');
    return {
      slug:    a.slug,
      title:   tr?.title || a.slug,
      excerpt: tr?.excerpt || '',
      category: a.category,
    };
  });

  return NextResponse.json({ vouchers: voucherResults, articles: articleResults });
}
