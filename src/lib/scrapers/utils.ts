/**
 * SCRAPER UTILITIES
 * Dùng chung cho tất cả scrapers
 */

// ── Validate code ──────────────────────────────────────────────────────────────
// Code hợp lệ: 3–30 ký tự, chỉ chứa A-Z 0-9 - _
export function isValidCode(code: string): boolean {
  return /^[A-Z0-9_\-]{3,30}$/.test(code.trim().toUpperCase());
}

export function cleanCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
}

// ── Parse discount value ───────────────────────────────────────────────────────
export function parseDiscount(text: string): { label: string; value: number } {
  const t = text.trim();

  // "68% off", "Save 80%", "Giảm 30%"
  const pct = t.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) return { label: `-${pct[1]}%`, value: parseFloat(pct[1]) };

  // "$5 off", "€10 off"
  const fixed = t.match(/[$€£¥](\d+(?:\.\d+)?)/);
  if (fixed) return { label: `-$${fixed[1]}`, value: parseFloat(fixed[1]) };

  // "3 months free", "2 months free"
  const months = t.match(/(\d+)\s*month/i);
  if (months) return { label: `${months[1]} months free`, value: 0 };

  return { label: t || 'Deal', value: 0 };
}

// ── Parse expiry date ──────────────────────────────────────────────────────────
// Nhận diện nhiều định dạng khác nhau từ các trang web
export function parseExpiry(text: string): Date | undefined {
  if (!text) return undefined;
  const t = text.trim();

  // ISO: "2026-12-31"
  const iso = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}`);

  // US: "12/31/2026" hoặc "12/31/26"
  const us = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (us) {
    const year = us[3].length === 2 ? `20${us[3]}` : us[3];
    return new Date(`${year}-${us[1].padStart(2,'0')}-${us[2].padStart(2,'0')}`);
  }

  // "Dec 31, 2026" / "December 31 2026" / "31 Dec 2026"
  const MONTHS: Record<string,string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
  };
  const written = t.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i)
    || t.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})[,\s]+(\d{4})/i);
  if (written) {
    const m0 = written[0].toLowerCase();
    for (const [abbr, num] of Object.entries(MONTHS)) {
      if (m0.includes(abbr)) {
        const dayMatch = m0.match(/\d{1,2}/);
        const yearMatch = m0.match(/\d{4}/);
        if (dayMatch && yearMatch) {
          return new Date(`${yearMatch[0]}-${num}-${dayMatch[0].padStart(2,'0')}`);
        }
      }
    }
  }

  // "Expires in 30 days"
  const days = t.match(/(\d+)\s*day/i);
  if (days) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(days[1]));
    return d;
  }

  return undefined;
}

// ── Extract discount value from nearby text ────────────────────────────────────
// Dùng khi code và discount nằm ở 2 element khác nhau
export function extractDiscountFromContext(html: string): { label: string; value: number } {
  // Tìm % discount trong đoạn HTML gần nhất
  const pctMatch = html.match(/(\d+(?:\.\d+)?)\s*%\s*(?:off|discount|save|giảm)/i)
    || html.match(/(?:off|discount|save|giảm)\s*(\d+(?:\.\d+)?)\s*%/i)
    || html.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) return { label: `-${pctMatch[1]}%`, value: parseFloat(pctMatch[1]) };
  return { label: 'Deal', value: 0 };
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

export const randomUA  = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
export const sleep     = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':      randomUA(),
      'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer':         'https://www.google.com/',
      'Cache-Control':   'no-cache',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ── __NEXT_DATA__ extractor ────────────────────────────────────────────────────
/** Trích JSON từ thẻ <script id="__NEXT_DATA__"> (nhiều React/Next.js site dùng) */
export function extractNextData(html: string): Record<string, unknown> | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]) as Record<string, unknown>; }
  catch { return null; }
}

/** Tìm đệ quy array trong JSON mà các item có field liên quan đến coupon */
export function findCouponArrays(obj: unknown, depth = 0): Record<string, unknown>[][] {
  if (depth > 10 || !obj || typeof obj !== 'object') return [];
  const results: Record<string, unknown>[][] = [];

  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    const keys = Object.keys(obj[0] as object).map(k => k.toLowerCase());
    const isCouponLike = keys.some(k =>
      ['code','coupon','promo','discount','offer','voucher','deal'].some(kw => k.includes(kw))
    );
    if (isCouponLike) results.push(obj as Record<string, unknown>[]);
  }

  if (!Array.isArray(obj)) {
    for (const v of Object.values(obj as object)) {
      results.push(...findCouponArrays(v, depth + 1));
    }
  }
  return results;
}
