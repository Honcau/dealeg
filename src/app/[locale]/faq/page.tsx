import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | Dealeg',
  description: 'Answers to common questions about using Dealeg, coupon codes, and how our platform works.',
};

type Props = { params: Promise<{ locale: string }> };

export default async function FAQPage({ params }: Props) {
  await params;
  const t = await getTranslations('faq');

  // 8 câu hỏi thường gặp
  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
    { q: t('q7'), a: t('a7') },
    { q: t('q8'), a: t('a8') },
  ];

  // JSON-LD FAQPage schema → rich snippet trên Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-500 mb-8">{t('subtitle')}</p>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-5 group"
              open={i === 0}
            >
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                {f.q}
                <span className="text-gray-400 group-open:rotate-180 transition-transform ml-4">▾</span>
              </summary>
              <p className="text-gray-600 text-sm mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-gray-700 font-medium mb-1">{t('moreTitle')}</p>
          <p className="text-sm text-gray-500">
            {t('moreText')}{' '}
            <a href="/contact" className="text-indigo-600 hover:underline">{t('contactUs')}</a>
          </p>
        </div>
      </div>
    </>
  );
}
