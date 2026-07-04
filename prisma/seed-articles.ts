/**
 * SEED ARTICLES — bài viết gốc về domain, hosting, VPS, VPN + how-to guides
 * Chạy: npm run seed:articles
 *
 * Tất cả tạo ở status DRAFT + locale 'en'.
 * Sau seed: /admin/articles → review → "Dịch tất cả ngôn ngữ" → publish
 */
import { PrismaClient } from '@prisma/client';
import * as fs   from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const ARTICLES = [
  // ── Comparison / "best of" ───────────────────────────────────────────────────
  {
    slug:     'best-domain-registrars-2026',
    category: 'domain',
    file:     'domain-registrars.md',
    title:    'Best Domain Registrars in 2026: A Complete Comparison',
    excerpt:  'Compare eight domain registrars on what actually matters — five-year renewal cost, free WHOIS privacy, transfer friendliness, and developer features.',
  },
  {
    slug:     'best-web-hosting-2026',
    category: 'hosting',
    file:     'web-hosting.md',
    title:    'Best Web Hosting in 2026: Shared, VPS, and Cloud Compared',
    excerpt:  'Understand the three types of hosting, then compare eight providers to match one to your project — with the renewal-price traps explained.',
  },
  {
    slug:     'best-vps-providers-2026',
    category: 'vps',
    file:     'vps-providers.md',
    title:    'Best Cheap VPS Providers in 2026: Ranked by Workload',
    excerpt:  'A developer-focused comparison of eight VPS providers across price, performance, and global reach — with guidance on when you actually need a VPS.',
  },
  {
    slug:     'best-vpn-2026',
    category: 'vpn',
    file:     'best-vpn-2026.md',
    title:    'Best VPN in 2026: Speed, Privacy, and Price Compared',
    excerpt:  'Compare the leading VPN providers on audited no-logs, jurisdiction, speed, and honest pricing — and learn how to avoid overpaying at renewal.',
  },

  // ── How-to guides ────────────────────────────────────────────────────────────
  {
    slug:     'how-to-point-domain-to-hosting',
    category: 'domain',
    file:     'how-to-point-domain.md',
    title:    'How to Point Your Domain to Your Hosting (Step by Step)',
    excerpt:  'Connecting a domain to hosting trips up nearly every beginner. This guide covers both methods, how to verify it worked, and the mistakes that cause errors.',
  },
  {
    slug:     'how-to-choose-web-hosting',
    category: 'hosting',
    file:     'how-to-choose-hosting.md',
    title:    'How to Choose Web Hosting: A Decision Framework',
    excerpt:  'Stop asking "which host is best?" and start asking "what does my project need?" A clear decision tree to match shared, VPS, or cloud to your site.',
  },
  {
    slug:     'how-to-build-your-first-website',
    category: 'hosting',
    file:     'how-to-build-first-website.md',
    title:    'How to Build Your First Website in 2026: Two Paths',
    excerpt:  'A complete walkthrough of both routes — traditional WordPress hosting and AI website builders — so you can pick the one that fits your skills and goals.',
  },
  {
    slug:     'how-to-save-money-on-tech',
    category: 'deals',
    file:     'how-to-save-on-tech.md',
    title:    'How to Save Money on Tech Subscriptions: 6 Strategies',
    excerpt:  'Domains, hosting, VPNs, and software quietly drain money through predictable tricks. Six deliberate habits to cut your annual tech spending without sacrifice.',
  },
  {
    slug:     'best-ai-website-builders-2026',
    category: 'website-builder',
    file:     'best-ai-website-builders-2026.md',
    title:    'Best AI Website Builders in 2026: Compared by Use Case',
    excerpt:  'AI website builders have split into three lanes — business, design, and code-first. Compare Wix, Hostinger, Framer, Webflow, and more, with the hidden costs exposed.',
  },
  {
    slug:     'best-ai-coding-tools-2026',
    category: 'coding-tools',
    file:     'best-ai-coding-tools-2026.md',
    title:    'Best AI Coding Tools in 2026: Copilot, Cursor, Claude Code',
    excerpt:  'A developer comparison across three paradigms — inline assistants, terminal agents, and AI IDEs. Honest pricing, and why the best developers combine several.',
  },

  // ── Batch 2: High-commission provider targeting ──────────────────────────────
  {
    slug:     'best-managed-wordpress-hosting-2026',
    category: 'hosting',
    file:     'best-managed-wordpress-hosting-2026.md',
    title:    'Best Managed WordPress Hosting in 2026: Kinsta, Cloudways, WP Engine',
    excerpt:  'Compare the leading managed WordPress hosts on speed, support, and price — from premium Kinsta to value-focused Cloudways — and decide if the premium is worth it.',
  },
  {
    slug:     'nordvpn-vs-surfshark-vs-expressvpn-2026',
    category: 'vpn',
    file:     'nordvpn-vs-surfshark-vs-expressvpn-2026.md',
    title:    'NordVPN vs Surfshark vs ExpressVPN (2026): Which Should You Pick?',
    excerpt:  'A head-to-head comparison of the three most recommended VPNs on speed, price, device limits, and features — so you pick the right one without overpaying.',
  },
  {
    slug:     'best-wordpress-hosting-beginners-2026',
    category: 'hosting',
    file:     'best-wordpress-hosting-beginners-2026.md',
    title:    'Best WordPress Hosting for Beginners in 2026',
    excerpt:  'The most beginner-friendly WordPress hosts compared — Bluehost, Hostinger, DreamHost, SiteGround — with the upsell traps and renewal tricks to avoid.',
  },
  {
    slug:     'cloudways-vs-kinsta-2026',
    category: 'hosting',
    file:     'cloudways-vs-kinsta-2026.md',
    title:    'Cloudways vs Kinsta (2026): Managed WordPress Compared',
    excerpt:  'Two top managed WordPress hosts, two very different approaches. Compare price, performance, and support to choose between premium simplicity and flexible value.',
  },
  {
    slug:     'best-wordpress-page-builders-2026',
    category: 'website-builder',
    file:     'best-wordpress-page-builders-2026.md',
    title:    'Best WordPress Page Builders in 2026: Elementor, Divi, Bricks',
    excerpt:  'Compare the top WordPress page builders on features, performance impact, and price — and learn how to build professional pages without slowing your site.',
  },
  {
    slug:     'best-password-managers-2026',
    category: 'security',
    file:     'best-password-managers-2026.md',
    title:    'Best Password Managers in 2026: Dashlane, Bitwarden, 1Password',
    excerpt:  'The single most impactful security tool compared — from open-source Bitwarden to polished Dashlane — so you finally use unique strong passwords everywhere.',
  },
  {
    slug:     'best-cloud-hosting-developers-2026',
    category: 'vps',
    file:     'best-cloud-hosting-developers-2026.md',
    title:    'Best Cloud Hosting for Developers in 2026',
    excerpt:  'A developer-focused comparison of DigitalOcean, Vultr, Linode, and Hetzner — plus when a managed layer on top of these clouds makes more sense.',
  },
  {
    slug:     'best-ecommerce-platforms-2026',
    category: 'ecommerce',
    file:     'best-ecommerce-platforms-2026.md',
    title:    'Best eCommerce Platforms in 2026: Shopify, WooCommerce, BigCommerce',
    excerpt:  'Match the right ecommerce platform to your store — hosted simplicity versus open-source control — with the fees and constraints that affect your bottom line.',
  },
  {
    slug:     'best-email-marketing-services-2026',
    category: 'software',
    file:     'best-email-marketing-services-2026.md',
    title:    'Best Email Marketing Services in 2026',
    excerpt:  'The highest-ROI marketing channel, compared. Mailchimp, ConvertKit, Brevo, ActiveCampaign, and MailerLite — matched to creators, stores, and businesses.',
  },
  {
    slug:     'how-to-start-a-blog-2026',
    category: 'hosting',
    file:     'how-to-start-a-blog-2026.md',
    title:    'How to Start a Blog in 2026 (and Make Money)',
    excerpt:  'A complete beginner walkthrough from zero to a live, monetizable blog — platform, hosting, content, audience, and honest ways to earn from it.',
  },

  // ── Batch 3: Online tools (high demand in Vietnam) ───────────────────────────
  {
    slug:     'best-pdf-editors-online-2026',
    category: 'tools',
    file:     'best-pdf-editors-online-2026.md',
    title:    'Best Online PDF Editors in 2026: Free and Paid Compared',
    excerpt:  'Edit, merge, convert, and sign PDFs in your browser. Compare Smallpdf, iLovePDF, Canva, PDF Reader Pro, and PDFelement — with privacy and free-tier limits explained.',
  },
  {
    slug:     'best-online-design-tools-2026',
    category: 'tools',
    file:     'best-online-design-tools-2026.md',
    title:    'Best Online Design Tools in 2026: Canva and Alternatives',
    excerpt:  'Create professional graphics with no design skills. Compare Canva, Adobe Express, Figma, VistaCreate, and Snappa — matched to beginners, marketers, and pros.',
  },
  {
    slug:     'how-to-edit-pdf-online-free-2026',
    category: 'tools',
    file:     'how-to-edit-pdf-online-free-2026.md',
    title:    'How to Edit a PDF Online for Free in 2026 (Step by Step)',
    excerpt:  'Fill forms, sign, annotate, merge, and convert PDFs for free in your browser. A step-by-step guide to every common task, and when free tools are not enough.',
  },
];

async function main() {
  console.log(`🌱 Seeding ${ARTICLES.length} articles...\n`);

  let created = 0;
  let skipped = 0;

  for (const a of ARTICLES) {
    const filePath = path.join(__dirname, 'articles', a.file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠  File không tồn tại: ${a.file} — bỏ qua`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    const existing = await prisma.article.findUnique({ where: { slug: a.slug } });
    if (existing) {
      console.log(`⏭  Bỏ qua "${a.slug}" — đã tồn tại`);
      skipped++;
      continue;
    }

    await prisma.article.create({
      data: {
        slug:     a.slug,
        status:   'DRAFT',
        category: a.category,
        translations: {
          create: {
            locale:           'en',
            title:            a.title,
            excerpt:          a.excerpt,
            content,
            isAutoTranslated: false,
          },
        },
      },
    });

    created++;
    console.log(`✅ ${a.title}`);
    console.log(`   ${a.slug} · ${a.category} · ${content.split(/\s+/).length} từ\n`);
  }

  console.log(`\n🎉 Xong! ${created} bài mới, ${skipped} bỏ qua.`);
  console.log('→ Vào /admin/articles để review, dịch, và publish.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
