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
