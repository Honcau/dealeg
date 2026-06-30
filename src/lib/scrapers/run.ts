/**
 * CLI RUNNER
 *   npm run scrape                  → chạy tất cả providers
 *   npm run scrape namecheap        → chạy 1 provider cụ thể
 *   SCRAPER_DEBUG=true npm run scrape namecheap  → lưu HTML để debug
 */
import { runAllScrapers }  from './index';
import { scrapeCoupert }   from './coupert';
import { scrapeDealhack }  from './dealhack';
import { PROVIDERS }       from './providers';

const target = process.argv[2]?.toLowerCase();

(async () => {
  if (target) {
    // Chạy 1 provider để test
    const provider = PROVIDERS.find(
      p => p.name.toLowerCase().includes(target) ||
           p.coupertSlug.includes(target)
    );

    if (!provider) {
      console.error(`Không tìm thấy provider "${target}"`);
      console.log('Providers có sẵn:', PROVIDERS.map(p => p.coupertSlug).join(', '));
      process.exit(1);
    }

    console.log(`\n🔍 Test scraper cho: ${provider.name}\n`);
    const [c, d] = await Promise.all([
      scrapeCoupert(provider),
      scrapeDealhack(provider),
    ]);

    console.log('\n=== Coupert results ===');
    c.forEach(v => console.log(`  [${v.isVerified ? '✓' : ' '}] ${v.code} — ${v.discount}${v.expiresAt ? ` (hết ${v.expiresAt.toLocaleDateString('vi')})` : ''}`));

    console.log('\n=== Dealhack results ===');
    d.forEach(v => console.log(`  [${v.isVerified ? '✓' : ' '}] ${v.code} — ${v.discount}${v.expiresAt ? ` (hết ${v.expiresAt.toLocaleDateString('vi')})` : ''}`));

    console.log(`\nTổng: ${c.length + d.length} vouchers`);

  } else {
    // Chạy tất cả + lưu DB
    const result = await runAllScrapers();
    console.log('\n📊 Kết quả cuối:', result);
  }

  process.exit(0);
})();
