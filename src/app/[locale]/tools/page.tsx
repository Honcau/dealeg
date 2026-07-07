import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/* Công cụ chỉ dành cho người dùng Việt Nam — chỉ hiện khi locale='vi'.
   Vẫn truy cập được qua URL trực tiếp ở mọi ngôn ngữ (Việt kiều duyệt tiếng Anh vẫn cần). */
const VN_ONLY = [
  { key: 'vietqr',   href: '/tools/vietqr' },
  { key: 'grossnet', href: '/tools/gross-net' },
  { key: 'vnfont',   href: '/tools/vn-font' },
  { key: 'idphoto',  href: '/tools/id-photo' },
  { key: 'lunar',    href: '/tools/lunar-calendar' },
  { key: 'interest', href: '/tools/interest' },
] as const;

/* Công cụ chung — hiện ở mọi ngôn ngữ */
const GLOBAL = [
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

export default async function ToolsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('tools');

  // Người dùng Việt thấy cả tool VN; ngôn ngữ khác chỉ thấy tool chung
  const list = locale === 'vi' ? [...VN_ONLY, ...GLOBAL] : [...GLOBAL];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">{t('title')}</h1>
      <p className="text-gray-500 mb-10">{t('subtitle')}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(({ key, href }) => (
          <ToolCard key={key} href={href} name={t(`${key}.name`)} desc={t(`${key}.desc`)} />
        ))}
      </div>
    </div>
  );
}
