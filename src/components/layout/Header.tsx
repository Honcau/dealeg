import { getTranslations }  from 'next-intl/server';
import { Link }             from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AuthButton }       from '@/components/auth/AuthButton';

export async function Header() {
  const t  = await getTranslations('nav');
  const tc = await getTranslations('common');

  const navLinks = [
    { href: '/category/domain',  label: t('domain')  },
    { href: '/category/hosting', label: t('hosting') },
    { href: '/category/vpn',     label: t('vpn')     },
    { href: '/tools',            label: t('tools')   },
    { href: '/blog',             label: t('blog')    },
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="text-xl font-extrabold text-indigo-600 tracking-tight shrink-0">
          {tc('appName')}
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-gray-500">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-gray-900 transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <AuthButton />
          <LanguageSwitcher />
          <Link href="/submit"
            className="hidden md:inline-block text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg transition-colors">
            {t('submit')}
          </Link>
        </div>
      </div>
    </header>
  );
}
