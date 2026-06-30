import { requireAdmin } from '@/lib/admin-auth';
import Link             from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/vouchers" className="text-sm font-bold text-indigo-600">
            Dealeg Admin
          </Link>
          <nav className="flex gap-4 text-sm text-gray-500">
            <Link href="/admin/vouchers"     className="hover:text-gray-900">Vouchers</Link>
            <Link href="/admin/articles"     className="hover:text-gray-900">Bài viết</Link>
            <Link href="/admin/submissions"  className="hover:text-gray-900">Submissions</Link>
          </nav>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Đăng xuất
          </button>
        </form>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
