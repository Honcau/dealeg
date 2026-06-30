import { getTranslations } from 'next-intl/server';

const TOOLS = [
  { key: 'pdf',     icon: '📄', href: '/tools/pdf',     color: 'bg-red-50 border-red-200' },
  { key: 'office',  icon: '📝', href: '/tools/office',  color: 'bg-blue-50 border-blue-200' },
  { key: 'image',   icon: '🖼', href: '/tools/image',   color: 'bg-purple-50 border-purple-200' },
  { key: 'convert', icon: '🔄', href: '/tools/convert', color: 'bg-green-50 border-green-200' },
] as const;

export default async function ToolsPage() {
  const t = await getTranslations('tools');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-gray-900">{t('title')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {TOOLS.map(({ key, icon, href, color }) => (
          <a
            key={key}
            href={href}
            className={`flex flex-col items-center gap-3 p-8 rounded-2xl border-2 ${color} hover:shadow-md transition-shadow`}
          >
            <span className="text-4xl">{icon}</span>
            <span className="font-semibold text-gray-800">{t(key)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
