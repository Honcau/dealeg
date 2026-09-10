/**
 * NGUỒN DEAL THÔ TỪ DIỄN ĐÀN — hiện chỉ LowEndTalk.
 *
 * Vì sao chỉ LET: LET công bố RSS công khai cho category Offers. WebHostingTalk chặn
 * truy cập tự động bằng Cloudflare (403 kể cả với UA trình duyệt) — đó là ý muốn rõ
 * ràng của họ, không dựng thứ để vượt qua.
 *
 * ⚠ ĐIỂM QUAN TRỌNG VỀ FEED: LET sắp item theo HOẠT ĐỘNG CUỐI, không theo ngày tạo.
 * Thread cũ bị ai đó comment vào vẫn nổi lên đầu feed (đã thấy thread từ 2025 trong
 * 100 item gần nhất). `pubDate` là ngày TẠO thread — nên nơi hiển thị phải sắp theo
 * postedAt giảm dần thì bài thật sự mới mới lên trước, thread bị bump chìm xuống.
 */
import { prisma } from '@/lib/db';

export const LET_OFFERS_FEED = 'https://lowendtalk.com/categories/offers/feed.rss';

export interface ParsedOffer {
  externalId: string;
  author:     string;
  title:      string;
  url:        string;
  body:       string;
  postedAt:   Date;
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'", '#039': "'",
};

/** Giải mã entity HTML (&amp; &gt; &#8220; ...) — feed LET có nhiều trong tiêu đề. */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (m, e: string) => {
    if (ENTITIES[e]) return ENTITIES[e];
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return m;
  });
}

/**
 * HTML bài viết → văn bản thuần ĐỌC ĐƯỢC.
 * Cố ý KHÔNG giữ HTML gốc: đây là nội dung do người ngoài viết, nhúng thẳng vào trang
 * admin là mở đường XSS. Đổi thẻ xuống dòng/ô bảng thành newline để bảng giá vẫn đọc được.
 */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, '\n')
      .replace(/<\/t[dh]>/gi, '\t')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Lấy nội dung 1 thẻ (bóc CDATA nếu có). */
function tag(item: string, name: string): string {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i').exec(item);
  if (!m) return '';
  const raw = m[1].trim();
  const cdata = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(raw);
  return (cdata ? cdata[1] : raw).trim();
}

/** RSS → danh sách offer. Bỏ qua item thiếu link/guid (không định danh được). */
export function parseOfferFeed(xml: string): ParsedOffer[] {
  const out: ParsedOffer[] = [];
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const url = decodeEntities(tag(item, 'link'));
    const externalId = tag(item, 'guid') || url;
    if (!url || !externalId) continue;

    const when = new Date(tag(item, 'pubDate'));
    out.push({
      externalId,
      author:   decodeEntities(tag(item, 'dc:creator') || tag(item, 'author')),
      title:    decodeEntities(tag(item, 'title')),
      url,
      body:     htmlToText(tag(item, 'description')),
      postedAt: Number.isNaN(when.getTime()) ? new Date() : when,
    });
  }
  return out;
}

export interface SyncResult { fetched: number; matched: number; created: number; skipped: number }

/**
 * Kéo feed → giữ bài của các username đang theo dõi → lưu bài CHƯA có.
 * Chống trùng bằng unique (source, externalId): bấm lại bao nhiêu lần cũng không nhân bản,
 * và KHÔNG ghi đè bài cũ (giữ nguyên status đã xử lý của người vận hành).
 */
export async function syncLetOffers(): Promise<SyncResult> {
  const source = 'lowendtalk';
  const sources = await prisma.offerSource.findMany({ where: { source, isActive: true }, select: { username: true } });
  const follow = new Set(sources.map(s => s.username.trim().toLowerCase()));

  const res = await fetch(LET_OFFERS_FEED, {
    headers: { 'User-Agent': 'dealeg/1.0 (+https://dealeg.com)' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`LET feed trả HTTP ${res.status}`);

  const all = parseOfferFeed(await res.text());
  const mine = follow.size === 0 ? [] : all.filter(o => follow.has(o.author.trim().toLowerCase()));

  let created = 0, skipped = 0;
  for (const o of mine) {
    const exists = await prisma.offerPost.findUnique({
      where: { source_externalId: { source, externalId: o.externalId } },
      select: { id: true },
    });
    if (exists) { skipped++; continue; }
    await prisma.offerPost.create({ data: { source, ...o } });
    created++;
  }
  return { fetched: all.length, matched: mine.length, created, skipped };
}
