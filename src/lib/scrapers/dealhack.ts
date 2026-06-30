/**
 * DEALHACK.COM SCRAPER
 * URL pattern: https://dealhack.com/coupons/[provider-slug]
 *
 * Dealhack có HTML tương đối ổn định — dùng CSS selectors chính,
 * thêm __NEXT_DATA__ làm fallback.
 */
import * as cheerio from 'cheerio';
import * as fs      from 'fs';
import * as path    from 'path';
import {
  fetchHtml, extractNextData, findCouponArrays,
  cleanCode, isValidCode, parseDiscount, parseExpiry,
} from './utils';
import { buildAffUrl, type Provider } from './providers';
import type { ScrapedVoucher }        from './types';

const BASE_URL   = 'https://dealhack.com/coupons';
const DEBUG_MODE = process.env.SCRAPER_DEBUG === 'true';

// ── CSS selectors cho dealhack.com ────────────────────────────────────────────
// Nếu scraper không lấy được: SCRAPER_DEBUG=true npm run scrape
// → Mở file debug/*.html → F12 → tìm element chứa code → copy selector vào đây
const SEL = {
  card:      ['.deal-card', '.coupon-card', '[class*="deal-item"]', '[class*="coupon-item"]',
               'article[class*="deal"]', '.offer-card', 'li[class*="offer"]'],
  code:      ['[data-clipboard-text]', '[data-coupon]', '[data-code]', '.code-text',
               '.coupon-code', '[class*="code"]', 'code'],
  discount:  ['[class*="badge"]', '[class*="percent"]', '[class*="discount"]',
               '[class*="saving"]', 'h2', 'h3', '.deal-title'],
  expiry:    ['[class*="expir"]', '[class*="expire"]', '[class*="valid-until"]',
               '.expiry', 'time[datetime]', '[class*="date"]'],
  verified:  ['[class*="verified"]', '[class*="check"]', '.verified-badge', '[class*="success"]'],
};

/** Chiến lược 1: __NEXT_DATA__ (nếu dealhack dùng Next.js) */
function parseNextData(html: string, provider: Provider, url: string): ScrapedVoucher[] {
  const nextData = extractNextData(html);
  if (!nextData) return [];

  const arrays = findCouponArrays(nextData);
  const results: ScrapedVoucher[] = [];

  for (const arr of arrays) {
    for (const item of arr) {
      const rawCode = String(
        item['code'] ?? item['couponCode'] ?? item['voucher'] ?? ''
      );
      const code = cleanCode(rawCode);
      if (!isValidCode(code)) continue;

      const discountRaw = String(item['title'] ?? item['description'] ?? item['discount'] ?? '');
      const { label: discount, value: discountValue } = parseDiscount(discountRaw);

      const expiryRaw   = String(item['expiryDate'] ?? item['expiry'] ?? item['endDate'] ?? '');
      const expiresAt   = parseExpiry(expiryRaw);
      const isVerified  = Boolean(item['verified'] ?? item['isVerified']);

      results.push({
        code, discount, discountValue,
        provider:    provider.name,
        category:    provider.category,
        affiliateUrl: buildAffUrl(provider),
        expiresAt,
        sourceUrl:   url,
        isVerified,
      });
    }
  }
  return results;
}

/** Chiến lược 2: CSS selectors */
function parseCssSelectors(html: string, provider: Provider, url: string): ScrapedVoucher[] {
  const $       = cheerio.load(html);
  const results: ScrapedVoucher[] = [];

  // Tìm card container
  let $cards = $();
  for (const sel of SEL.card) {
    $cards = $(sel);
    if ($cards.length > 0) break;
  }

  if ($cards.length === 0) {
    // Fallback: tìm bất kỳ thẻ nào chứa text hợp lệ
    $cards = $('[class*="coupon"], [class*="deal"], [class*="offer"]');
  }

  $cards.each((_, el) => {
    const $el = $(el);

    // Code — thử data attr trước (dealhack hay dùng data-clipboard-text)
    let rawCode = $el.find('[data-clipboard-text]').attr('data-clipboard-text') ?? '';
    if (!rawCode) {
      for (const sel of SEL.code) {
        rawCode = $el.find(sel).attr('data-coupon')
          ?? $el.find(sel).attr('data-code')
          ?? $el.find(sel).text();
        if (rawCode?.trim()) break;
      }
    }

    const code = cleanCode(String(rawCode));
    if (!isValidCode(code)) return;

    // Discount
    let discountRaw = '';
    for (const sel of SEL.discount) {
      discountRaw = $el.find(sel).first().text().trim();
      if (discountRaw) break;
    }
    const { label: discount, value: discountValue } = parseDiscount(discountRaw || $el.text());

    // Expiry — ưu tiên attribute datetime trước
    let expiresAt: Date | undefined;
    for (const sel of SEL.expiry) {
      const datetime = $el.find(sel).attr('datetime');
      const text     = $el.find(sel).text().trim();
      expiresAt      = parseExpiry(datetime ?? text);
      if (expiresAt) break;
    }

    // Verified
    let isVerified = false;
    for (const sel of SEL.verified) {
      if ($el.find(sel).length) { isVerified = true; break; }
    }
    if (!isVerified) {
      isVerified = /verified|confirmed/i.test($el.text());
    }

    results.push({
      code, discount, discountValue,
      provider:    provider.name,
      category:    provider.category,
      affiliateUrl: buildAffUrl(provider),
      expiresAt,
      sourceUrl:   url,
      isVerified,
    });
  });

  return results;
}

function saveDebugHtml(html: string, slug: string) {
  const dir  = path.join(process.cwd(), 'debug');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `dealhack-${slug}-${Date.now()}.html`);
  fs.writeFileSync(file, html, 'utf8');
  console.log(`[Debug] Saved → ${file}`);
}

export async function scrapeDealhack(provider: Provider): Promise<ScrapedVoucher[]> {
  const url = `${BASE_URL}/${provider.dealhackSlug}`;
  console.log(`[Dealhack] Scraping ${provider.name} → ${url}`);

  try {
    const html = await fetchHtml(url);
    if (DEBUG_MODE) saveDebugHtml(html, provider.dealhackSlug);

    // Thử __NEXT_DATA__ trước
    let results = parseNextData(html, provider, url);
    if (results.length > 0) {
      console.log(`[Dealhack/${provider.name}] __NEXT_DATA__: ${results.length} vouchers`);
      return results;
    }

    // Fallback CSS
    results = parseCssSelectors(html, provider, url);
    console.log(
      results.length > 0
        ? `[Dealhack/${provider.name}] CSS: ${results.length} vouchers`
        : `[Dealhack/${provider.name}] Không tìm thấy gì`
    );
    return results;

  } catch (err) {
    console.error(`[Dealhack/${provider.name}] Lỗi: ${err}`);
    return [];
  }
}
