import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & About | Dealeg',
  description: 'Learn about Dealeg and how to get in touch.',
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto prose prose-gray">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Contact & About</h1>
      <p className="text-sm text-gray-400 mb-8">Get in touch or learn more about Dealeg</p>

      <div className="space-y-8 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">About Dealeg</h2>
          <p>Dealeg is a platform dedicated to helping people find the best deals, coupon codes, and discounts on technology products and services — from web hosting and domains to VPNs, software, and online tools.</p>
          <p className="mt-2">We combine verified coupon codes with honest, in-depth guides and comparisons to help you make informed decisions and save money. Our content is available in multiple languages to serve users around the world.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">What We Do</h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>Aggregate and verify coupon codes and deals for tech products</li>
            <li>Write original, honest comparison guides and how-to articles</li>
            <li>Let our community verify which codes are working through votes and comments</li>
            <li>Serve content in 12 languages for a global audience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Get in Touch</h2>
          <p>We'd love to hear from you. Whether you have a question, feedback, a partnership inquiry, or want to report an expired coupon, reach out:</p>
          <div className="bg-gray-50 rounded-xl p-5 mt-3 not-prose">
            <p className="text-sm text-gray-700"><strong>Email:</strong> <a href="mailto:contact@dealeg.com" className="text-indigo-600 hover:underline">contact@dealeg.com</a></p>
            <p className="text-sm text-gray-500 mt-2">We aim to respond within a few business days.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">For Businesses</h2>
          <p>If you run a product or service and would like to list your deals on Dealeg or discuss a partnership, please email us. We're always interested in bringing more great deals to our users.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Report an Issue</h2>
          <p>Found a coupon that no longer works, or noticed something wrong? Let us know so we can keep our information accurate for everyone. You can also use the voting feature on each coupon to help the community.</p>
        </section>
      </div>
    </div>
  );
}
