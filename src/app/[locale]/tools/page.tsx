import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const TOOLS = [
  { key: 'vietqr',   href: '/tools/vietqr',    icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3z' },
  { key: 'grossnet', href: '/tools/gross-net', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { key: 'discount', href: '/tools/discount',  icon: 'M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z' },
  { key: 'currency', href: '/tools/currency',  icon: 'M4 10h16M4 10l4-4M4 10l4 4M20 14H4M20 14l-4-4M20 14l-4 4' },
  { key: 'password', href: '/tools/password',  icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
] as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools' });
  return { title: `${t('title')} | Dealeg`, description: t('subtitle') };
}

export default async function ToolsPage() {
  const t = await getTranslations('tools');

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">{t('title')}</h1>
      <p className="text-gray-500 mb-10">{t('subtitle')}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map(({ key, href, icon }) => (
          <Link key={key} href={href}
            className="group bg-white border border-gray-200 hover:border-indigo-500 rounded-xl p-5 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
              className="w-7 h-7 text-gray-400 group-hover:text-indigo-600 transition-colors mb-3">
              <path d={icon} />
            </svg>
            <h2 className="font-semibold text-gray-900 text-sm mb-1">{t(`${key}.name`)}</h2>
            <p className="text-xs text-gray-400 leading-relaxed">{t(`${key}.desc`)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
