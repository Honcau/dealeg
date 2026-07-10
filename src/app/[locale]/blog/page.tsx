import type { Metadata }     from 'next';
import Image from 'next/image';
import { getTranslations }   from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { prisma }            from '@/lib/db';

// ISR: cache trang đã render, tự làm mới mỗi 5 phút (nhanh hơn nhiều so với render mỗi request)
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = { title: 'Blog | Dealeg' };

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;

  const articles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      translations: {
        where: { locale },
        select: { title: true, excerpt: true },
      },
    },
    orderBy: { publishedAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-gray-900">Blog</h1>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article: typeof articles[number]) => {
          const t = article.translations[0];
          const title   = t?.title   ?? article.slug;
          const excerpt = t?.excerpt ?? '';

          return (
            <Link
              key={article.id}
              href={`/blog/${article.slug}`}
              className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group"
            >
              {article.coverImage && (
                <div className="relative w-full h-40 mb-4">
                  <Image src={article.coverImage} alt={title} fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover rounded-xl" />
                </div>
              )}
              {article.category && (
                <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                  {article.category}
                </span>
              )}
              <h2 className="font-bold text-gray-900 mt-1 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {title}
              </h2>
              {excerpt && (
                <p className="text-sm text-gray-500 line-clamp-3">{excerpt}</p>
              )}
              <p className="text-xs text-gray-300 mt-3">
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString(locale)
                  : ''}
              </p>
            </Link>
          );
        })}
      </div>

      {articles.length === 0 && (
        <p className="text-center text-gray-400 py-16">Chưa có bài viết nào.</p>
      )}
    </div>
  );
}
