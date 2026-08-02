import type { Metadata }  from 'next';
import Image from 'next/image';
import { notFound }        from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma }          from '@/lib/db';
import { getArticleTranslation } from '@/lib/translation';
import { ShareButtons } from '@/components/share/ShareButtons';
import { Link } from '@/i18n/navigation';
import { buildAlternates } from '@/lib/seo';
import { routing } from '@/i18n/routing';
import { maskVoucherCode } from '@/lib/utils';

// ISR: cache trang đã render, tự làm mới mỗi 5 phút (nhanh hơn nhiều so với render mỗi request)
export const revalidate = 300;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return {};
  const { translation } = await getArticleTranslation(article.id, locale);
  const title = translation?.title ?? slug;
  const cover = article.coverImage
    ? `https://dealeg.com${article.coverImage}`
    : 'https://dealeg.com/og-image.png';

  // Chỉ những locale ĐÃ DỊCH THẬT (có row ArticleTranslation) mới là trang riêng.
  // Locale chưa dịch hiển thị fallback bản 'en' → canonical trỏ về 'en' để Google
  // gộp, khỏi index bản sao. Locale đã dịch → tự trỏ + hreflang trong nhóm đã dịch.
  const realLocales = (await prisma.articleTranslation.findMany({
    where: { articleId: article.id },
    select: { locale: true },
  })).map((tr) => tr.locale);
  const alternates = realLocales.includes(locale)
    ? buildAlternates(locale, `/blog/${slug}`, routing.locales.filter((l) => realLocales.includes(l)))
    : { canonical: `https://dealeg.com/en/blog/${slug}` };

  return {
    title,
    description: translation?.excerpt ?? undefined,
    alternates,
    openGraph: {
      title,
      description: translation?.excerpt ?? undefined,
      type: 'article',
      images: [{ url: cover, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: translation?.excerpt ?? undefined,
      images: [cover],
    },
  };
}

/** Chuyển Markdown đơn giản → HTML (không cần thư viện nặng) */
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-2xl font-extrabold mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/`(.+?)`/g,      '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/^\- (.+)$/gm,   '<li class="ml-4 list-disc">$1</li>')
    .replace(/^> (.+)$/gm,    '<blockquote class="border-l-4 border-indigo-300 pl-4 text-gray-600 italic my-4">$1</blockquote>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(.+)$(?!<\/?(h[123]|li|blockquote))/gm, (m) => m.startsWith('<') ? m : m);
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tự động biến tên provider trong nội dung bài viết thành hyperlink về /[locale]/provider/[slug].
 * - Chỉ link LẦN XUẤT HIỆN ĐẦU TIÊN của mỗi provider (tránh spam link).
 * - Match nguyên từ (không dính chữ khác), không phân biệt hoa thường.
 * - Bỏ qua text nằm trong thẻ HTML và trong <a> có sẵn (không link chồng link).
 */
function linkProviders(html: string, providers: { name: string; slug: string }[], locale: string): string {
  if (providers.length === 0) return html;
  const sorted = [...providers].sort((a, b) => b.name.length - a.name.length); // tên dài match trước
  const linked = new Set<string>();
  const parts = html.split(/(<[^>]+>)/g); // index lẻ = thẻ, index chẵn = text
  let anchorDepth = 0;

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      if (/^<a\b/i.test(part))      anchorDepth++;
      else if (/^<\/a>/i.test(part)) anchorDepth = Math.max(0, anchorDepth - 1);
      return part;
    }
    if (anchorDepth > 0 || !part) return part;
    let text = part;
    for (const p of sorted) {
      if (linked.has(p.slug)) continue;
      const re = new RegExp(`(^|[^\\w])(${escapeReg(p.name)})(?![\\w])`, 'i');
      if (re.test(text)) {
        text = text.replace(re, (_m, pre, name) =>
          `${pre}<a href="/${locale}/provider/${p.slug}" class="text-indigo-600 font-medium hover:underline">${name}</a>`);
        linked.add(p.slug);
      }
    }
    return text;
  }).join('');
}

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations('blog');

  const article = await prisma.article.findUnique({
    where: { slug, status: 'PUBLISHED' },
  });

  if (!article) notFound();

  const { translation, isFallback } = await getArticleTranslation(article.id, locale);
  if (!translation) notFound();

  // Tự động hyperlink tên provider trong bài → trang provider (chỉ provider đang active)
  const linkableProviders = await prisma.provider.findMany({
    where: { isActive: true },
    select: { name: true, slug: true },
  });
  const html = linkProviders(markdownToHtml(translation.content), linkableProviders, locale);

  // ── Liên quan (thay box newsletter cuối bài): voucher phổ biến + blog khác ──
  const relatedVouchers = await prisma.voucher.findMany({
    where: { isActive: true },
    orderBy: { useCount: 'desc' },
    take: 5,
    select: { id: true, code: true, provider: true, discount: true, hideCode: true },
  });
  let relatedRows = await prisma.article.findMany({
    where: { status: 'PUBLISHED', slug: { not: slug }, ...(article.category ? { category: article.category } : {}) },
    orderBy: { publishedAt: 'desc' },
    take: 5,
    include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
  });
  if (relatedRows.length < 5) {
    const seen = new Set([slug, ...relatedRows.map(p => p.slug)]);
    const more = await prisma.article.findMany({
      where: { status: 'PUBLISHED', slug: { notIn: [...seen] } },
      orderBy: { publishedAt: 'desc' },
      take: 5 - relatedRows.length,
      include: { translations: { where: { locale: { in: [locale, 'en'] } } } },
    });
    relatedRows = [...relatedRows, ...more];
  }
  const relatedPosts = relatedRows.map(p => {
    const tr = p.translations.find(x => x.locale === locale) ?? p.translations.find(x => x.locale === 'en');
    return { slug: p.slug, title: tr?.title ?? p.slug };
  });

  const localeNames: Record<string, string> = {
    vi:'Tiếng Việt', en:'English', zh:'中文', hi:'हिंदी',
    es:'Español', pt:'Português', fr:'Français', de:'Deutsch',
    ar:'العربية', ru:'Русский', ja:'日本語', ko:'한국어',
  };

  return (
    <article className="max-w-2xl mx-auto">
      {/* Banner báo chưa có bản dịch — CHỈ hiện cho người không có bản dịch, nên phải
          viết bằng chính ngôn ngữ của họ (trước đây là tiếng Việt: vô nghĩa với họ). */}
      {isFallback && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 mb-6 text-sm">
          {t('fallbackNotice', { lang: localeNames[locale] ?? locale })}
        </div>
      )}

      {/* Header */}
      {article.coverImage && (
        <div className="relative w-full h-64 mb-8">
          <Image src={article.coverImage} alt={translation.title} fill priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover rounded-2xl" />
        </div>
      )}
      {article.category && (
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
          {article.category}
        </span>
      )}
      <h1 className="text-3xl font-extrabold text-gray-900 mt-2 mb-4 leading-tight">
        {translation.title}
      </h1>
      {translation.excerpt && (
        <p className="text-lg text-gray-500 mb-8 leading-relaxed">{translation.excerpt}</p>
      )}

      {/* Content */}
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: `<p class="mb-4">${html}</p>` }}
      />

      {/* Published date */}
      {article.publishedAt && (
        <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-400">
          {t('publishedOn')} {new Date(article.publishedAt).toLocaleDateString(locale, {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </div>
      )}

      {/* Chia sẻ bài viết */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <ShareButtons title={translation.title} />
      </div>

      {/* Liên quan: voucher + blog (2 cột) */}
      {(relatedVouchers.length > 0 || relatedPosts.length > 0) && (
        <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {relatedVouchers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                {t('relatedVouchers')}
              </h2>
              <div className="space-y-2">
                {relatedVouchers.map(v => (
                  <Link key={v.id} href={`/voucher/${v.id}`}
                    className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 p-3 hover:border-indigo-300 transition-colors">
                    <span className="min-w-0">
                      <span className="block font-mono font-bold text-sm text-gray-800 truncate">{v.hideCode ? maskVoucherCode(v.code) : v.code}</span>
                      <span className="text-xs text-gray-400">{v.provider}</span>
                    </span>
                    <span className="shrink-0 text-indigo-600 font-bold text-sm">{v.discount}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {relatedPosts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
                {t('relatedPosts')}
              </h2>
              <div className="space-y-2">
                {relatedPosts.map(p => (
                  <Link key={p.slug} href={`/blog/${p.slug}`}
                    className="block bg-white rounded-xl border border-gray-200 p-3 hover:border-indigo-300 transition-colors">
                    <span className="text-sm font-medium text-gray-800 line-clamp-2">{p.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
