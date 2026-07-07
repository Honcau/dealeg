import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/* Nhóm VN — cạnh tranh thấp, volume cao */
const TOOLS_VN = [
  { key: 'vietqr',   href: '/tools/vietqr' },
  { key: 'grossnet', href: '/tools/gross-net' },
  { key: 'vnfont',   href: '/tools/vn-font' },
  { key: 'idphoto',  href: '/tools/id-photo' },
  { key: 'lunar',    href: '/tools/lunar-calendar' },
  { key: 'interest', href: '/tools/interest' },
] as const;

/* Nhóm chung — nhân 12 ngôn ngữ */
const TOOLS_GLOBAL = [
  { key: 'discount',      href: '/tools/discount' },
  { key: 'unitprice',     href: '/tools/unit-price' },
  { key: 'currency',      href: '/tools/currency' },
  { key: 'password',      href: '/tools/password' },
  { key: 'num2words',     href: '/tools/number-to-words' },
  { key: 'textcounter',   href: '/tools/text-counter' },
  { key: 'imagecompress', href: '/tools/image-compress' },
  { key: 'pdf',           href: '/tools/pdf' },
  { key: 'qr',            href: '/tools/qr' },
  { key: 'datecalc',      href: '/tools/date-calculator' },
  { key: 'utm',           href: '/tools/utm-builder' },
  { key: 'json',          href: '/tools/json' },
  { key: 'base64',        href: '/tools/base64' },
  { key: 'hash',          href: '/tools/hash' },
] as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools' });
  return { title: `${t('title')} | Dealeg`, description: t('subtitle') };
}

function ToolCard({ href, name, desc }: { href: string; name: string; desc: string }) {
  return (
    <Link href={href}
      className="group bg-white border border-gray-200 hover:border-indigo-500 rounded-xl p-5 transition-colors">
      <h2 className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">{name}</h2>
      <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{desc}</p>
    </Link>
  );
}

export default async function ToolsPage() {
  const t = await getTranslations('tools');

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">{t('title')}</h1>
        <p className="text-gray-500">{t('subtitle')}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">🇻🇳 {t('sectionVn')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS_VN.map(({ key, href }) => (
            <ToolCard key={key} href={href} name={t(`${key}.name`)} desc={t(`${key}.desc`)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">🌍 {t('sectionGlobal')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS_GLOBAL.map(({ key, href }) => (
            <ToolCard key={key} href={href} name={t(`${key}.name`)} desc={t(`${key}.desc`)} />
          ))}
        </div>
      </section>
    </div>
  );
}
