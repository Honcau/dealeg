import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function Footer() {
  const t = await getTranslations('footer');
  const tn = await getTranslations('nav');

  return (
    <footer className="border-t border-gray-100 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          {/* Brand */}
          <div>
            <Link href="/" className="text-base font-extrabold text-indigo-600">
              Dealeg
            </Link>
            <p className="text-xs text-gray-400 mt-1">{t('affiliate')}</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-400">
            <Link href="/domain"  className="hover:text-gray-600 transition-colors">{tn('domain')}</Link>
            <Link href="/hosting" className="hover:text-gray-600 transition-colors">{tn('hosting')}</Link>
            <Link href="/vpn"     className="hover:text-gray-600 transition-colors">{tn('vpn')}</Link>
            <Link href="/tools"   className="hover:text-gray-600 transition-colors">{tn('tools')}</Link>
            <Link href="/submit"  className="hover:text-gray-600 transition-colors">{tn('submit')}</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          </nav>

        </div>

        <p className="mt-8 text-xs text-gray-300">{t('rights')}</p>
      </div>
    </footer>
  );
}
