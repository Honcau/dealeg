import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { NewsletterForm } from '@/components/newsletter/NewsletterForm';

export async function Footer() {
  const t = await getTranslations('footer');
  const tn = await getTranslations('nav');

  return (
    <footer className="border-t border-gray-100 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Newsletter */}
        <div className="mb-10 max-w-md">
          <NewsletterForm source="footer" variant="card" />
        </div>

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
            <Link href="/category/aitool"  className="hover:text-gray-600 transition-colors">{tn('aitool')}</Link>
            <Link href="/category/vps"     className="hover:text-gray-600 transition-colors">{tn('vps')}</Link>
            <Link href="/category/hosting" className="hover:text-gray-600 transition-colors">{tn('hosting')}</Link>
            <Link href="/category/vpn"     className="hover:text-gray-600 transition-colors">{tn('vpn')}</Link>
            <Link href="/tools"   className="hover:text-gray-600 transition-colors">{tn('tools')}</Link>
            <Link href="/blog"    className="hover:text-gray-600 transition-colors">Blog</Link>
            <Link href="/submit"  className="hover:text-gray-600 transition-colors">{tn('submit')}</Link>
          </nav>
        </div>

        {/* Legal links */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-400">
            <Link href="/about"      className="hover:text-gray-600 transition-colors">{t('about')}</Link>
            <Link href="/contact"    className="hover:text-gray-600 transition-colors">{t('contact')}</Link>
            <Link href="/faq"        className="hover:text-gray-600 transition-colors">FAQ</Link>
            <Link href="/privacy"    className="hover:text-gray-600 transition-colors">{t('privacy')}</Link>
            <Link href="/terms"      className="hover:text-gray-600 transition-colors">{t('terms')}</Link>
            <Link href="/disclaimer" className="hover:text-gray-600 transition-colors">{t('disclaimer')}</Link>
          </nav>

        </div>

        <p className="mt-8 text-xs text-gray-300">{t('rights')}</p>
      </div>
    </footer>
  );
}
