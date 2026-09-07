import { getTranslations } from 'next-intl/server';

/**
 * Nội dung hướng dẫn + FAQ cho trang tool, RENDER PHÍA SERVER.
 *
 * Vì sao cần: các trang /tools/* chỉ có ~21–63 từ trong HTML (tool chạy bằng JS phía
 * client), nên Google coi là trang mỏng — 240 URL tools gần như không được index và
 * còn ngốn ngân sách crawl của blog. Component này bơm nội dung THẬT vào HTML.
 *
 * Nội dung nằm ở namespace `toolGuide.<toolKey>` trong messages/*.json → dịch 11 ngôn
 * ngữ còn lại bằng `npm run i18n:fill`. Thiếu key thì tự fallback tiếng Anh (deepMerge
 * trong src/i18n/request.ts), nên không vỡ khi chưa dịch xong.
 *
 * KHÔNG dùng mảng trong JSON (step1..step4, q1..q3) để script i18n:fill ghi lại an toàn.
 */
export async function ToolGuide({ toolKey }: { toolKey: string }) {
  const t  = await getTranslations(`toolGuide.${toolKey}`);
  const tc = await getTranslations('toolGuide');

  if (!t.has('intro')) return null;   // tool chưa viết nội dung → không render gì

  const steps = (['step1', 'step2', 'step3', 'step4'] as const).filter(k => t.has(k));
  const faqs  = ([1, 2, 3] as const)
    .filter(i => t.has(`q${i}`) && t.has(`a${i}`))
    .map(i => ({ q: t(`q${i}`), a: t(`a${i}`) }));

  return (
    <section className="mt-12 border-t border-gray-200 pt-8 max-w-3xl">
      <p className="text-gray-700 leading-relaxed">{t('intro')}</p>

      {steps.length > 0 && (
        <>
          <h2 className="font-display text-lg font-bold text-gray-900 mt-8 mb-3">{tc('howToTitle')}</h2>
          <ol className="list-decimal ml-5 space-y-2 text-gray-700 leading-relaxed">
            {steps.map(k => <li key={k}>{t(k)}</li>)}
          </ol>
        </>
      )}

      {faqs.length > 0 && (
        <>
          <h2 className="font-display text-lg font-bold text-gray-900 mt-8 mb-3">{tc('faqTitle')}</h2>
          <div className="space-y-5">
            {faqs.map((f, i) => (
              <div key={i}>
                <h3 className="font-semibold text-gray-900 mb-1">{f.q}</h3>
                <p className="text-gray-700 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          {/* FAQPage schema: từ 2023 Google gần như không hiện rich result FAQ cho site
              thường, nên đây chỉ là đánh dấu ngữ nghĩa — giá trị nằm ở nội dung. */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }) }}
          />
        </>
      )}

      {t.has('tip') && (
        <div className="mt-8 rounded-xl bg-indigo-50 border border-indigo-100 p-4">
          <h2 className="font-semibold text-indigo-900 mb-1">{tc('tipTitle')}</h2>
          <p className="text-indigo-900/80 leading-relaxed">{t('tip')}</p>
        </div>
      )}
    </section>
  );
}
