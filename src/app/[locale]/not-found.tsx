import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('notFound');

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 lớn với gradient thương hiệu */}
        <div className="font-display text-8xl font-bold text-indigo-600 mb-4 tabular-nums">
          404
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-500 mb-8">{t('description')}</p>

        {/* Nút về trang chủ + xem deal */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
            {t('backHome')}
          </Link>
          <Link href="/coupon"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
            {t('browseDeals')}
          </Link>
        </div>

        {/* Gợi ý các trang phổ biến */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3">{t('popularPages')}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link href="/category/aitool" className="text-xs text-indigo-600 hover:underline">AI Tools</Link>
            <span className="text-gray-300">·</span>
            <Link href="/category/vps" className="text-xs text-indigo-600 hover:underline">VPS</Link>
            <span className="text-gray-300">·</span>
            <Link href="/category/hosting" className="text-xs text-indigo-600 hover:underline">Hosting</Link>
            <span className="text-gray-300">·</span>
            <Link href="/category/vpn" className="text-xs text-indigo-600 hover:underline">VPN</Link>
            <span className="text-gray-300">·</span>
            <Link href="/blog" className="text-xs text-indigo-600 hover:underline">Blog</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
