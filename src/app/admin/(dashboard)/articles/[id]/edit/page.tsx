'use client';

import { useParams } from 'next/navigation';
import { ArticleEditor } from '@/components/admin/ArticleEditor';

export default function EditArticlePage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Sửa bài viết</h1>
      <ArticleEditor articleId={id} />
    </div>
  );
}
