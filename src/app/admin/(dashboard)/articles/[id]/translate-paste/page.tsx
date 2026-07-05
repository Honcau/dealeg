'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PasteTranslation } from '@/components/admin/PasteTranslation';

export default function TranslatePastePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<{ slug: string; translations: { locale: string }[] } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/articles/${id}`)
      .then(r => r.json())
      .then(setArticle)
      .catch(() => {});
  }, [id]);

  if (!article) return <div className="py-16 text-center text-gray-400">Đang tải...</div>;

  const enTr = article.translations?.find(t => t.locale === 'en');

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
        <Link href="/admin/articles" className="hover:text-gray-600">Bài viết</Link>
        <span>/</span>
        <Link href={`/admin/articles/${id}/edit`} className="hover:text-gray-600">Sửa</Link>
        <span>/</span>
        <span className="text-gray-600">Dịch (paste)</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">Dịch bài viết bằng DeepL web</h1>
      <p className="text-sm text-gray-400 mb-6">
        Slug: <code className="bg-gray-100 px-1.5 py-0.5 rounded">{article.slug}</code>
      </p>

      {!enTr ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          ⚠ Bài này chưa có bản tiếng Anh. Vào <Link href={`/admin/articles/${id}/edit`} className="underline font-medium">trang sửa</Link> để nhập nội dung tiếng Anh trước.
        </div>
      ) : (
        <PasteTranslation articleId={id} existingTranslations={article.translations ?? []} />
      )}
    </div>
  );
}
