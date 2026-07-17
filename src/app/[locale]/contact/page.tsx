import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: `${t('title')} | Dealeg`, description: t('subtitle') };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  return (
    <div className="max-w-3xl mx-auto prose prose-gray">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{t('title')}</h1>
      <p className="text-sm text-gray-400 mb-8">{t('subtitle')}</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('aboutTitle')}</h2>
          <p>{t('aboutP1')}</p>
          <p className="mt-2">{t('aboutP2')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('whatTitle')}</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>{t('what1')}</li>
            <li>{t('what2')}</li>
            <li>{t('what3')}</li>
            <li>{t('what4')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('touchTitle')}</h2>
          <p>{t('touchP')}</p>
          <div className="bg-gray-50 rounded-xl p-5 mt-3 not-prose">
            <p className="text-sm text-gray-700">
              <strong>{t('emailLabel')}:</strong>{' '}
              <a href="mailto:contact@dealeg.com" className="text-indigo-600 hover:underline">contact@dealeg.com</a>
            </p>
            <p className="text-sm text-gray-500 mt-2">{t('replyTime')}</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('bizTitle')}</h2>
          <p>{t('bizP')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('reportTitle')}</h2>
          <p>{t('reportP')}</p>
        </section>
      </div>
    </div>
  );
}
