import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | Dealeg',
  description: 'How Dealeg earns from affiliate links and our commitment to honest recommendations.',
};

export default function DisclaimerPage() {
  const updated = 'July 2026';

  return (
    <div className="max-w-3xl mx-auto prose prose-gray">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Affiliate Disclosure</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: {updated}</p>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Our Commitment to Transparency</h2>
          <p>At Dealeg, we believe in being completely honest with our visitors. This disclosure explains how we make money and how it affects (or doesn't affect) the information we provide.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">How We Earn</h2>
          <p>Dealeg participates in affiliate marketing programs. This means that when you click certain links on our site and make a purchase, we may earn a commission from the merchant. These are called "affiliate links".</p>
          <p className="mt-2"><strong>Importantly, this comes at no additional cost to you.</strong> You pay the same price whether you use our link or go directly to the merchant. The commission comes from the merchant's marketing budget, not from your pocket.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Our Editorial Independence</h2>
          <p>We want to be clear about how affiliate relationships affect our content:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li>Our reviews and comparisons reflect our genuine assessment of products and services.</li>
            <li>We include both strengths and weaknesses of the products we discuss.</li>
            <li>We do not recommend a product solely because it pays a higher commission.</li>
            <li>Our goal is to help you make informed decisions, because we believe honest, useful content serves both you and us in the long run.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Coupon Codes and Deals</h2>
          <p>The coupon codes and deals we list are provided for your benefit. Some link to merchants through affiliate links. We make reasonable efforts to verify that codes work, but availability and terms are ultimately controlled by the merchants.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Affiliate Programs We Participate In</h2>
          <p>We participate in various affiliate programs and networks, which may include programs run by hosting providers, VPN services, software companies, domain registrars, and affiliate networks such as Impact and PartnerStack, among others. The specific programs may change over time.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Why This Matters</h2>
          <p>Affiliate commissions are what allow us to keep Dealeg running and free to use. When you use our links, you're supporting our work at no cost to yourself, which we genuinely appreciate. In return, we commit to providing honest, useful information to help you find the best deals and make good decisions.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Questions?</h2>
          <p>If you have any questions about our affiliate relationships or this disclosure, please <a href="/contact" className="text-indigo-600 hover:underline">contact us</a>. We're happy to be transparent about how we operate.</p>
        </section>
      </div>
    </div>
  );
}
