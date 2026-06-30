import { ArticleForm } from '@/components/admin/ArticleForm';
export const metadata = { title: 'Bài viết mới | Admin' };
export default function NewArticlePage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Bài viết mới</h1>
      <ArticleForm />
    </div>
  );
}
