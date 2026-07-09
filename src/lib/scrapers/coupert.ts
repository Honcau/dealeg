/**
 * COUPERT.COM SCRAPER
 * URL pattern: https://www.coupert.com/coupons/[provider-slug]
 *
 * Chiến lược (theo thứ tự ưu tiên):
 *  1. __NEXT_DATA__ JSON  → nhanh, chính xác, ổn định
 *  2. CSS selectors       → fallback nếu site render khác
 *  3. Debug mode          → lưu HTML ra file để inspect
 */
import * as cheerio from 'cheerio';
import * as fs      from 'fs';
import * as path    from 'path';
import {
  fetchHtml, extractNextData, findCouponArrays,
  cleanCode, isValidCode, parseDiscount, parseExpiry, sleep, randomUA,
} from './utils';
import { buildAffUrl, type Provider }  from './providers';
import type { ScrapedVoucher }         from './types';

const BASE_URL    = 'https://www.coupert.com/coupons';
const DEBUG_MODE  = process.env.SCRAPER_DEBUG === 'true';

// ── CSS selectors — cập nhật nếu coupert.com thay đổi HTML ───────────────────
// Cách tìm: mở coupert.com/coupons/namecheap → F12 → inspect element coupon
const SEL = {
  // Container mỗi coupon
  card:       ['.coupon-card', '.coupon-item', '[class*="CouponCard"]', '[class*="coupon-"]', 'li[class*="coupon"]'],
  // Mã code
  code:       ['[data-code]', '.code', '.coupon-code', '[class*="Code"]', 'code', '[class*="code"]'],
  // Mô tả giảm giá ("Save 30%", "80% off")
  discount:   ['[class*="discount"]', '[class*="Discount"]', '[class*="save"]', '[class*="percent"]', 'h3', 'h2'],
  // Ngày hết hạn ("Expires Dec 31")
  expiry:     ['[class*="expire"]', '[class*="Expire"]', '[class*="valid"]', '[class*="Valid"]', 'time'],
  // Badge "Verified"
  verified:   ['[class*="verified"]', '[class*="Verified"]', '[class*="success"]'],
  // Tỉ lệ thành công "87% success"
  successRate:['[class*="success-rate"]', '[class*="successRate"]', '[class*="rate"]'],
};

/** Chiến lược 1: Extract từ __NEXT_DATA__ */
function parseNextData(
  html: string,
  provider: Provider,
  sourceUrl: string,
): ScrapedVoucher[] {
  const nextData = extractNextData(html);
  if (!nextData) return [];

  const arrays = findCouponArrays(nextData);
  if (!arrays.length) return [];

  const results: ScrapedVoucher[] = [];

  for (const arr of arrays) {
    for (const item of arr) {
      // Tìm field chứa code (tên field khác nhau tùy site version)
      const rawCode = (
        item['code'] ?? item['couponCode'] ?? item['promo'] ?? item['promoCode'] ?? ''
      ) as string;

      const code = cleanCode(String(rawCode));
      if (!isValidCode(code)) continue;

      // Discount
      const discountRaw = String(
        item['title'] ?? item['discount'] ?? item['description'] ?? item['label'] ?? ''
      );
      const { label: discount, value: discountValue } = parseDiscount(discountRaw);

      // Expiry
      const expiryRaw = String(
        item['expiryDate'] ?? item['expiry'] ?? item['validUntil'] ?? item['endDate'] ?? ''
      );
      const expiresAt = parseExpiry(expiryRaw) ?? undefined;

      // Verified
      const isVerified = Boolean(
        item['verified'] ?? item['isVerified'] ?? item['status'] === 'verified'
      );

      // Success rate
      const rateRaw   = item['successRate'] ?? item['successPercent'] ?? item['rate'];
      const successRate = rateRaw ? parseFloat(String(rateRaw)) : undefined;

      results.push({
        code, discount, discountValue,
        provider:    provider.name,
        category:    provider.category,
        affiliateUrl: buildAffUrl(provider),
        expiresAt,
        sourceUrl,
        isVerified,
        successRate,
      });
    }
  }

  return results;
}

/** Chiến lược 2: CSS selectors */
function parseCssSelectors(
  html: string,
  provider: Provider,
  sourceUrl: string,
): ScrapedVoucher[] {
  const $       = cheerio.load(html);
  const results: ScrapedVoucher[] = [];

  // Thử từng card selector cho đến khi tìm được
  let $cards = $();
  for (const sel of SEL.card) {
    $cards = $(sel);
    if ($cards.length > 0) break;
  }

  if ($cards.length === 0) {
    console.warn(`[Coupert/${provider.name}] Không tìm thấy coupon cards — thử cập nhật SEL.card`);
    return [];
  }

  $cards.each((_, el) => {
    const $el = $(el);

    // Lấy code
    let rawCode = '';
    for (const sel of SEL.code) {
      const found = $el.find(sel).first();
      rawCode = (found.attr('data-code') ?? found.text()).trim();
      if (rawCode) break;
    }
    const code = cleanCode(rawCode);
    if (!isValidCode(code)) return; // skip

    // Lấy discount
    let discountRaw = '';
    for (const sel of SEL.discount) {
      discountRaw = $el.find(sel).first().text().trim();
      if (discountRaw) break;
    }
    const { label: discount, value: discountValue } = parseDiscount(discountRaw || $el.text());

    // Lấy expiry
    let expiryRaw = '';
    for (const sel of SEL.expiry) {
      expiryRaw = $el.find(sel).first().attr('datetime') ?? $el.find(sel).first().text().trim();
      if (expiryRaw) break;
    }
    const expiresAt = parseExpiry(expiryRaw) ?? undefined;

    // Verified: nếu badge "verified" tồn tại
    let isVerified = false;
    for (const sel of SEL.verified) {
      if ($el.find(sel).length > 0) { isVerified = true; break; }
    }
    // Fallback: check text
    if (!isVerified) {
      isVerified = $el.text().toLowerCase().includes('verified');
    }

    // Success rate
    let successRate: number | undefined;
    for (const sel of SEL.successRate) {
      const txt = $el.find(sel).first().text();
      const m   = txt.match(/(\d+)\s*%/);
      if (m) { successRate = parseInt(m[1]); break; }
    }

    results.push({
      code, discount, discountValue,
      provider:     provider.name,
      category:     provider.category,
      affiliateUrl: buildAffUrl(provider),
      expiresAt,
      sourceUrl,
      isVerified,
      successRate,
    });
  });

  return results;
}

/** Lưu HTML ra file debug để inspect (chỉ khi SCRAPER_DEBUG=true) */
function saveDebugHtml(html: string, slug: string, source: string) {
  const dir  = path.join(process.cwd(), 'debug');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${source}-${slug}-${Date.now()}.html`);
  fs.writeFileSync(file, html, 'utf8');
  console.log(`[Debug] HTML saved → ${file}`);
}

/** Scrape 1 provider từ coupert.com */
export async function scrapeCoupert(provider: Provider): Promise<ScrapedVoucher[]> {
  const url = `${BASE_URL}/${provider.coupertSlug}`;
  console.log(`[Coupert] Scraping ${provider.name} → ${url}`);

  try {
    const html = await fetchHtml(url);

    if (DEBUG_MODE) saveDebugHtml(html, provider.coupertSlug, 'coupert');

    // Chiến lược 1: __NEXT_DATA__
    let results = parseNextData(html, provider, url);
    if (results.length > 0) {
      console.log(`[Coupert/${provider.name}] __NEXT_DATA__: ${results.length} vouchers`);
      return results;
    }

    // Chiến lược 2: CSS selectors
    results = parseCssSelectors(html, provider, url);
    if (results.length > 0) {
      console.log(`[Coupert/${provider.name}] CSS: ${results.length} vouchers`);
      return results;
    }

    console.warn(`[Coupert/${provider.name}] Không tìm thấy gì — bật SCRAPER_DEBUG=true để xem HTML`);
    return [];

  } catch (err) {
    console.error(`[Coupert/${provider.name}] Lỗi: ${err}`);
    return [];
  }
}
