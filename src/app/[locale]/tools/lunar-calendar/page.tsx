import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LunarTool } from '@/components/tools/LunarTool';
import { DealsCta } from '@/components/tools/DealsCta';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.lunar' });
  return { title: `${t('name')} | Dealeg`, description: t('desc') };
}

export default async function Page() {
  const t = await getTranslations('tools.lunar');
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">{t('name')}</h1>
      <p className="text-sm text-gray-500 mb-8">{t('desc')}</p>
      <LunarTool />
      <DealsCta />
    </div>
  );
}
