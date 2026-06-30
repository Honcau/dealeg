/**
 * SEED SCRIPT
 * Chạy bằng: npm run db:seed
 * Yêu cầu: đã chạy "npm run db:push" trước
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Xoá data cũ để seed lại sạch
  await prisma.voucherTranslation.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.scraperJob.deleteMany();
  await prisma.provider.deleteMany();

  // ── 1. Providers ───────────────────────────────────────────────────────────
  await prisma.provider.createMany({
    data: [
      { name: 'Namecheap', slug: 'namecheap', website: 'https://namecheap.com',  category: 'DOMAIN',  hasAffiliateApi: true,  scrapeUrl: 'https://www.namecheap.com/promos/',     scrapeType: 'CHEERIO', isActive: true },
      { name: 'Hostinger', slug: 'hostinger', website: 'https://hostinger.com',  category: 'HOSTING', hasAffiliateApi: false, scrapeUrl: 'https://www.hostinger.com/coupons',     scrapeType: 'CHEERIO', isActive: true },
      { name: 'NordVPN',   slug: 'nordvpn',   website: 'https://nordvpn.com',    category: 'VPN',     hasAffiliateApi: false, scrapeUrl: 'https://nordvpn.com/coupon/',           scrapeType: 'CHEERIO', isActive: true },
      { name: 'Porkbun',   slug: 'porkbun',   website: 'https://porkbun.com',    category: 'DOMAIN',  hasAffiliateApi: false, scrapeUrl: 'https://porkbun.com/promotions',        scrapeType: 'CHEERIO', isActive: true },
      { name: 'Cloudflare',slug: 'cloudflare',website: 'https://cloudflare.com', category: 'CDN',     hasAffiliateApi: false, isActive: true },
      { name: 'ExpressVPN',slug: 'expressvpn',website: 'https://expressvpn.com', category: 'VPN',     hasAffiliateApi: false, scrapeUrl: 'https://www.expressvpn.com/order',      scrapeType: 'CHEERIO', isActive: true },
    ],
  });
  console.log('✅ Providers created');

  // ── 2. Vouchers + translations ─────────────────────────────────────────────
  const vouchers = [
    {
      code: 'CHEAP2026', discount: '-30%', discountValue: 30, category: 'DOMAIN',
      provider: 'Namecheap', affiliateUrl: 'https://namecheap.com?aff=dealeg',
      expiresAt: new Date('2026-12-31'), isVerified: true, useCount: 2841,
      vi: { title: 'Giảm 30% tên miền .com đầu tiên', description: 'Áp dụng cho đơn đăng ký mới, không bao gồm gia hạn' },
      en: { title: '30% off first .com domain',        description: 'Applies to new registrations only, not renewals' },
    },
    {
      code: 'HOST80', discount: '-80%', discountValue: 80, category: 'HOSTING',
      provider: 'Hostinger', affiliateUrl: 'https://hostinger.com?ref=dealeg',
      expiresAt: new Date('2026-09-30'), isVerified: true, useCount: 5102,
      vi: { title: 'Giảm 80% gói Business Hosting', description: 'Gói 12 tháng trở lên, thanh toán một lần' },
      en: { title: '80% off Business Hosting plan',  description: '12-month plans or longer, one-time payment' },
    },
    {
      code: 'NORDVPN68', discount: '-68%', discountValue: 68, category: 'VPN',
      provider: 'NordVPN', affiliateUrl: 'https://nordvpn.com?aff=dealeg',
      isVerified: true, useCount: 3915,
      vi: { title: 'Giảm 68% gói 2 năm + 3 tháng miễn phí', description: 'Bảo vệ đến 6 thiết bị cùng lúc' },
      en: { title: '68% off 2-year plan + 3 free months',     description: 'Protect up to 6 devices simultaneously' },
    },
    {
      code: 'PORK10', discount: '-10%', discountValue: 10, category: 'DOMAIN',
      provider: 'Porkbun', affiliateUrl: 'https://porkbun.com?coupon=dealeg',
      isVerified: false, useCount: 812,
      vi: { title: 'Giảm 10% tất cả tên miền', description: 'Không giới hạn số lượng tên miền' },
      en: { title: '10% off all domains',       description: 'No quantity limit' },
    },
    {
      code: 'CLOUDFREE', discount: 'Giá gốc', discountValue: 0, category: 'CDN',
      provider: 'Cloudflare', affiliateUrl: 'https://cloudflare.com/registrar',
      isVerified: true, useCount: 9201,
      vi: { title: 'Tên miền giá gốc — không markup', description: 'Cloudflare bán đúng giá nhà đăng ký, rẻ nhất thị trường' },
      en: { title: 'At-cost domain — no markup',      description: 'Cloudflare sells at registry cost, cheapest on the market' },
    },
    {
      code: 'EXPR49', discount: '-49%', discountValue: 49, category: 'VPN',
      provider: 'ExpressVPN', affiliateUrl: 'https://expressvpn.com?offer=dealeg',
      expiresAt: new Date('2026-08-31'), isVerified: true, useCount: 1728,
      vi: { title: 'Giảm 49% + 3 tháng miễn phí', description: 'Gói 12 tháng, tốc độ cao nhất trong các VPN' },
      en: { title: '49% off + 3 free months',      description: '12-month plan, fastest speeds among VPN providers' },
    },
  ];

  for (const v of vouchers) {
    const { vi, en, ...data } = v;
    const voucher = await prisma.voucher.create({ data: { ...data, isActive: true } });
    await prisma.voucherTranslation.createMany({
      data: [
        { voucherId: voucher.id, locale: 'vi', ...vi },
        { voucherId: voucher.id, locale: 'en', ...en },
      ],
    });
  }

  console.log(`✅ ${vouchers.length} vouchers + translations created`);
  console.log('\n🎉 Seed complete! Run: npm run dev');
}

main().catch(console.error).finally(() => prisma.$disconnect());
