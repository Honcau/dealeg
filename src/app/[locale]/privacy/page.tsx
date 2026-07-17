import type { Metadata } from 'next';
import { EnglishOnlyNotice } from '@/components/layout/EnglishOnlyNotice';

export const metadata: Metadata = {
  title: 'Privacy Policy | Dealeg',
  description: 'How Dealeg collects, uses, and protects your information.',
};

export default async function PrivacyPage() {
  const updated = 'July 2026';

  return (
    <div className="max-w-3xl mx-auto prose prose-gray">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-2">Last updated: {updated}</p>

      {/* Trang pháp lý cố ý chỉ có tiếng Anh — nói thẳng bằng ngôn ngữ của user */}
      <EnglishOnlyNotice />

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">1. Introduction</h2>
          <p>Dealeg ("we", "us", "our") operates the website dealeg.com. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website. By using Dealeg, you agree to the practices described here.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc ml-6 space-y-1 mt-2">
            <li><strong>Account information:</strong> When you sign in, we collect your name, email, and profile picture from your chosen provider (Google, Facebook, GitHub) or the email you register with.</li>
            <li><strong>Newsletter subscriptions:</strong> If you subscribe, we store your email address and language preference.</li>
            <li><strong>Community contributions:</strong> Comments and votes you post, associated with your account.</li>
            <li><strong>Usage data:</strong> Anonymous analytics about how you use the site (pages visited, general location, device type) to improve our service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">3. How We Use Your Information</h2>
          <p>We use your information to: provide and maintain the service, send newsletters you subscribed to, display your community contributions, improve our website, and communicate with you about your account or our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">4. Cookies and Tracking</h2>
          <p>We use cookies to keep you signed in, remember your language preference, and understand how the site is used through analytics. You can control cookies through your browser settings, though disabling them may affect functionality.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">5. Affiliate Links</h2>
          <p>Dealeg contains affiliate links. When you click through and make a purchase, we may earn a commission at no extra cost to you. These links may use cookies to track referrals. See our <a href="/disclaimer" className="text-indigo-600 hover:underline">Affiliate Disclosure</a> for details.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">6. Third-Party Services</h2>
          <p>We use third-party services including authentication providers (Google, Facebook, GitHub), analytics, and affiliate networks. These services have their own privacy policies governing their use of your information.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">7. Data Security</h2>
          <p>We implement reasonable security measures to protect your information. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">8. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. You can unsubscribe from our newsletter at any time using the link in each email. To request deletion of your account or data, contact us.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">9. Children's Privacy</h2>
          <p>Dealeg is not intended for children under 13. We do not knowingly collect information from children under 13.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-2">11. Contact</h2>
          <p>If you have questions about this Privacy Policy, please <a href="/contact" className="text-indigo-600 hover:underline">contact us</a>.</p>
        </section>
      </div>
    </div>
  );
}
