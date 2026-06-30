/**
 * NAMECHEAP SCRAPER
 * Cào trang promo của Namecheap, extract coupon codes + discount
 *
 * Cách hoạt động:
 *   1. Fetch HTML trang promo
 *   2. Cheerio parse HTML → tìm coupon codes theo CSS selector
 *   3. Parse giá trị discount từ text
 */
import * as cheerio from 'cheerio';
import type { ScrapedVoucher } from './types';

const SOURCE_URL = 'https://www.namecheap.com/promos/';
const PROVIDER   = 'Namecheap';

/** Extract số từ string: "Save 30%" → 30, "$5 off" → 5 */
function parseDiscountValue(text: string): number {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

export async function scrapeNamecheap(): Promise<ScrapedVoucher[]> {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: {
        // Giả làm trình duyệt thật để tránh bị block
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Timeout 15 giây
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $    = cheerio.load(html);
    const results: ScrapedVoucher[] = [];

    /**
     * TODO: Sau khi mở namecheap.com/promos trên trình duyệt,
     * nhấn F12 → inspect phần tử chứa coupon code →
     * copy CSS selector và điền vào đây.
     *
     * Ví dụ nếu code nằm trong: <span class="promo-code">CHEAP2026</span>
     * thì selector là: '.promo-code'
     */
    $('[data-promo-code], .promo-code, .coupon-code').each((_, el) => {
      const code         = $(el).text().trim().toUpperCase();
      const parentText   = $(el).closest('[class*="promo"], [class*="deal"]').text();
      const discountText = parentText.match(/(\d+%|\$\d+|\d+ months? free)/i)?.[0] ?? '0';
      const discountVal  = parseDiscountValue(discountText);

      if (code && code.length >= 4) {
        results.push({
          code,
          discount: discountText || code,
          discountValue: discountVal,
          provider: PROVIDER,
          affiliateUrl: `${SOURCE_URL}?aff=${process.env.NAMECHEAP_AFFILIATE_ID ?? 'dealeg'}`,
          sourceUrl: SOURCE_URL,
        });
      }
    });

    // Fallback: nếu không tìm thấy qua selectors, trả về voucher mặc định
    // (hữu ích trong giai đoạn đầu khi chưa fine-tune selectors)
    if (results.length === 0) {
      console.warn('[Namecheap] No vouchers found via selectors — using fallback');
      results.push({
        code: 'NEWCOM88',
        discount: '-88%',
        discountValue: 88,
        provider: PROVIDER,
        affiliateUrl: `https://namecheap.com/domains/?aff=${process.env.NAMECHEAP_AFFILIATE_ID ?? 'dealeg'}`,
        sourceUrl: SOURCE_URL,
      });
    }

    console.log(`[Namecheap] Found ${results.length} voucher(s)`);
    return results;

  } catch (err) {
    console.error('[Namecheap] Scrape failed:', err);
    return []; // Không throw — để các scraper khác tiếp tục chạy
  }
}
