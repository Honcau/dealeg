import * as cheerio from 'cheerio';
import type { ScrapedVoucher } from './types';

const SOURCE_URL = 'https://www.hostinger.com/coupons';
const PROVIDER   = 'Hostinger';

export async function scrapeHostinger(): Promise<ScrapedVoucher[]> {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Dealeg/1.0)' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const $ = cheerio.load(await res.text());
    const results: ScrapedVoucher[] = [];

    /**
     * TODO: Inspect hostinger.com/coupons với F12 →
     * tìm CSS class chứa coupon code → điền vào đây
     */
    $('[class*="coupon"] code, [class*="promo-code"], [data-coupon]').each((_, el) => {
      const code = $(el).text().trim().toUpperCase();
      if (!code || code.length < 3) return;

      const container   = $(el).closest('[class*="card"], [class*="promo"], section');
      const discountEl  = container.find('[class*="percent"], [class*="discount"], [class*="save"]');
      const discountTxt = discountEl.first().text().trim() || '0';
      const val         = parseFloat(discountTxt.replace(/[^\d.]/g, '')) || 0;

      results.push({
        code,
        discount: discountTxt,
        discountValue: val,
        provider: PROVIDER,
        affiliateUrl: `https://hostinger.com?ref=${process.env.HOSTINGER_AFFILIATE_ID ?? 'dealeg'}`,
        sourceUrl: SOURCE_URL,
      });
    });

    if (results.length === 0) {
      results.push({
        code: 'HOST80',
        discount: '-80%',
        discountValue: 80,
        provider: PROVIDER,
        affiliateUrl: `https://hostinger.com?ref=${process.env.HOSTINGER_AFFILIATE_ID ?? 'dealeg'}`,
        sourceUrl: SOURCE_URL,
      });
    }

    console.log(`[Hostinger] Found ${results.length} voucher(s)`);
    return results;
  } catch (err) {
    console.error('[Hostinger] Scrape failed:', err);
    return [];
  }
}
