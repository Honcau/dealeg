'use client';

import { useEffect, useState } from 'react';
import { useParams }           from 'next/navigation';
import { ArticleForm }         from '@/components/admin/ArticleForm';
import type { ArticleFormData } from '@/components/admin/ArticleForm';

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Partial<ArticleFormData> | null>(null);
  const [translations, setTranslations] = useState<{ locale: string; isAutoTranslated: boolean }[]>([]);

  useEffect(() => {
    fetch(`/api/admin/articles/${id}`)
      .then(r => r.json())
      .then(article => {
        const en = article.translations?.find((t: { locale: string }) => t.locale === 'en');
        setTranslations(article.translations ?? []);
        setData({
          slug:       article.slug,
          status:     article.status,
          category:   article.category ?? '',
          coverImage: article.coverImage ?? '',
          title:      en?.title   ?? '',
          excerpt:    en?.excerpt ?? '',
          content:    en?.content ?? '',
        });
      });
  }, [id]);

  if (!data) return <div className="py-16 text-center text-gray-400">Đang tải...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Sửa bài viết</h1>
      <ArticleForm initial={data} articleId={id} translations={translations} />
    </div>
  );
}
