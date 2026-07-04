import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Dealeg',
  description: 'The terms governing your use of Dealeg.',
};

export default function TermsPage() {
  const updated = 'July 2026';

  return (
    <div className="max-w-3xl mx-auto prose prose-gray">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {updated}</p>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
          <p>By accessing and using dealeg.com ("Dealeg", "the service"), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">2. Description of Service</h2>
          <p>Dealeg is a platform that aggregates coupon codes, deals, and discounts for technology products and services, along with related articles and guides. We provide this information for your convenience.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">3. Coupon Codes and Deals</h2>
          <p>We make reasonable efforts to keep coupon codes and deals accurate and current, but we do not guarantee that any code will work or that any deal will be available. Codes may expire, be discontinued, or have restrictions set by the merchant. We are not responsible for the fulfillment of any offer, which is solely the responsibility of the merchant.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">4. User Accounts</h2>
          <p>When you create an account, you are responsible for maintaining its security and for all activity under it. You agree to provide accurate information and to notify us of any unauthorized use.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">5. User Contributions</h2>
          <p>You may submit comments, votes, and coupon submissions. By doing so, you grant us the right to display this content. You agree not to post content that is unlawful, offensive, misleading, spam, or infringes others' rights. We reserve the right to remove any content at our discretion.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">6. Affiliate Relationships</h2>
          <p>Dealeg participates in affiliate programs and earns commissions from qualifying purchases made through our links. This does not affect the price you pay. See our <a href="/disclaimer" className="text-indigo-600 hover:underline">Affiliate Disclosure</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">7. Intellectual Property</h2>
          <p>The content we create (articles, guides, site design) is our property. Coupon codes and factual deal information are not copyrightable. You may not reproduce our original content without permission.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">8. Disclaimer of Warranties</h2>
          <p>The service is provided "as is" without warranties of any kind. We do not warrant that the service will be uninterrupted, error-free, or that information will be accurate or complete.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">9. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, Dealeg shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service, including from reliance on any coupon, deal, or information.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">10. Third-Party Links</h2>
          <p>Our service contains links to third-party websites. We are not responsible for the content, policies, or practices of these external sites.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">11. Changes to Terms</h2>
          <p>We may modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">12. Contact</h2>
          <p>Questions about these Terms? Please <a href="/contact" className="text-indigo-600 hover:underline">contact us</a>.</p>
        </section>
      </div>
    </div>
  );
}
