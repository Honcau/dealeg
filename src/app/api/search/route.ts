import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TOOLS } from '@/lib/tools-list';

/**
 * GET /api/search?q=...&locale=vi
 * Tìm trong: công cụ (tên/mô tả đã dịch), voucher, bài viết.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const locale = req.nextUrl.searchParams.get('locale') ?? 'vi';

  if (q.length < 2) {
    return NextResponse.json({ tools: [], vouchers: [], articles: [] });
  }

  // ── Tìm công cụ ──
  // Đọc bản dịch tools từ messages theo locale (fallback en)
  let toolMessages: Record<string, { name?: string; desc?: string }> = {};
  try {
    const msgs = (await import(`../../../../messages/${locale}.json`)).default;
    toolMessages = msgs.tools ?? {};
  } catch {
    try {
      const en = (await import(`../../../../messages/en.json`)).default;
      toolMessages = en.tools ?? {};
    } catch {}
  }

  const qLower = q.toLowerCase();
  const toolResults = TOOLS
    .filter(tool => {
      // VN-only chỉ hiện khi locale vi
      if (tool.vnOnly && locale !== 'vi') return false;
      const tr = toolMessages[tool.key];
      if (!tr) return false;
      const name = (tr.name ?? '').toLowerCase();
      const desc = (tr.desc ?? '').toLowerCase();
      // Khớp tên/mô tả, hoặc khớp slug (vd gõ "qr", "pdf", "json")
      return name.includes(qLower) || desc.includes(qLower) || tool.href.includes(qLower);
    })
    .slice(0, 5)
    .map(tool => ({
      href: tool.href,
      name: toolMessages[tool.key]?.name ?? tool.key,
    }));

  // ── Tìm voucher + bài viết (song song) ──
  const [vouchers, articles] = await Promise.all([
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

  const voucherResults = vouchers.map(v => {
    const tr = v.translations.find(t => t.locale === locale) ?? v.translations.find(t => t.locale === 'en');
    return {
      id: v.id, provider: v.provider, code: v.code,
      discount: v.discount, discountValue: v.discountValue,
      title: tr?.title || `${v.provider} ${v.discount}`,
    };
  });

  const articleResults = articles.map(a => {
    const tr = a.translations.find(t => t.locale === locale) ?? a.translations.find(t => t.locale === 'en');
    return { slug: a.slug, title: tr?.title || a.slug, excerpt: tr?.excerpt || '', category: a.category };
  });

  return NextResponse.json({ tools: toolResults, vouchers: voucherResults, articles: articleResults });
}
