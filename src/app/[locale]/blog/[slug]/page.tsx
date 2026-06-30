import type { Metadata }  from 'next';
import { notFound }        from 'next/navigation';
import { prisma }          from '@/lib/db';
import { getArticleTranslation } from '@/lib/translation';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article) return {};
  const { translation } = await getArticleTranslation(article.id, locale);
  return { title: translation?.title ?? slug };
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

export default async function ArticlePage({ params }: Props) {
  const { locale, slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug, status: 'PUBLISHED' },
  });

  if (!article) notFound();

  const { translation, isFallback } = await getArticleTranslation(article.id, locale);
  if (!translation) notFound();

  const html = markdownToHtml(translation.content);

  const localeNames: Record<string, string> = {
    vi:'Tiếng Việt', en:'English', zh:'中文', hi:'हिंदी',
    es:'Español', pt:'Português', fr:'Français', de:'Deutsch',
    ar:'العربية', ru:'Русский', ja:'日本語', ko:'한국어',
  };

  return (
    <article className="max-w-2xl mx-auto">
      {/* Fallback banner */}
      {isFallback && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 mb-6 text-sm">
          Bài viết này chưa có bản dịch {localeNames[locale] ?? locale}. Đang hiển thị bằng tiếng Anh.
        </div>
      )}

      {/* Header */}
      {article.coverImage && (
        <img src={article.coverImage} alt={translation.title}
          className="w-full h-64 object-cover rounded-2xl mb-8" />
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
          Đăng ngày {new Date(article.publishedAt).toLocaleDateString(locale, {
            year: 'numeric', month: 'long', day: 'numeric'
          })}
        </div>
      )}
    </article>
  );
}
