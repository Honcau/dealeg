import * as cheerio from 'cheerio';
import type { ScrapedVoucher } from './types';

const SOURCE_URL = 'https://nordvpn.com/coupon/';
const PROVIDER   = 'NordVPN';

export async function scrapeNordVpn(): Promise<ScrapedVoucher[]> {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Dealeg/1.0)' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const $ = cheerio.load(await res.text());
    const results: ScrapedVoucher[] = [];

    $('[class*="coupon-code"], [data-coupon-code], .code-box').each((_, el) => {
      const code = $(el).text().trim().toUpperCase();
      if (!code || code.length < 3) return;

      const container   = $(el).closest('[class*="deal"], [class*="offer"], section');
      const discountTxt = container.find('[class*="percent"], [class*="off"]').first().text().trim() || '0';
      const val         = parseFloat(discountTxt.replace(/[^\d.]/g, '')) || 0;

      results.push({
        code,
        discount: discountTxt,
        discountValue: val,
        provider: PROVIDER,
        affiliateUrl: `https://nordvpn.com?aff=${process.env.NORDVPN_AFFILIATE_ID ?? 'dealeg'}`,
        sourceUrl: SOURCE_URL,
      });
    });

    if (results.length === 0) {
      results.push({
        code: 'NORDVPN68',
        discount: '-68%',
        discountValue: 68,
        provider: PROVIDER,
        affiliateUrl: `https://nordvpn.com?aff=${process.env.NORDVPN_AFFILIATE_ID ?? 'dealeg'}`,
        sourceUrl: SOURCE_URL,
      });
    }

    console.log(`[NordVPN] Found ${results.length} voucher(s)`);
    return results;
  } catch (err) {
    console.error('[NordVPN] Scrape failed:', err);
    return [];
  }
}
