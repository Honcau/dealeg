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

/**
 * LowEndBox — feed GỘP đúng các mục offer (chính nav của LEB dùng chuỗi slug này).
 * Không lấy /feed/ chung: feed chung có ~60% là Editorial & News, feed này chỉ lọt ~1/20.
 */
export const LEB_OFFERS_FEED =
  'https://lowendbox.com/category/virtual-servers,dedicated-servers,reseller-hosting,' +
  'shared-hosting,special-offers,seedbox-offers,community-offers,vpn/feed/';

export interface ParsedOffer {
  externalId: string;
  author:     string;
  title:      string;
  url:        string;
  body:       string;
  tags:       string[];
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
    // LEB để toàn văn ở content:encoded (description chỉ là trích đoạn ~390 ký tự);
    // LET không có content:encoded nên rơi về description — một hàm chạy đúng cả hai.
    const rawBody = tag(item, 'content:encoded') || tag(item, 'description');
    const tags = [...item.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi)]
      .map(m => decodeEntities(m[1].replace(/^<!\[CDATA\[|\]\]>$/g, '').trim()))
      .filter(Boolean);

    out.push({
      externalId,
      author:   decodeEntities(tag(item, 'dc:creator') || tag(item, 'author')),
      title:    decodeEntities(tag(item, 'title')),
      url,
      body:     htmlToText(rawBody),
      tags,
      postedAt: Number.isNaN(when.getTime()) ? new Date() : when,
    });
  }
  return out;
}

export interface SyncResult { fetched: number; matched: number; created: number; skipped: number }

/**
 * Dò xem một bài có nhắc tới provider đang theo dõi không → trả TÊN khớp, hoặc null.
 *
 * Cần vì LEB KHÁC LET: `dc:creator` của LEB luôn là biên tập viên (raindog308), không
 * phải provider — tên provider nằm trong tiêu đề và tag. Dùng CHUNG cho cả ô đếm ở bảng
 * nguồn lẫn nhãn ★ trên bài, để hai chỗ không bao giờ nói khác nhau.
 *
 * Khớp linh hoạt phần ngăn cách ("just.hosting" bắt được "Just Hosting"/"JustHosting")
 * nhưng CHẶN hai đầu bằng ranh giới chữ-số, nên "Hop" không khớp nhầm trong "Shop".
 */
export function makeFollowMatcher(names: string[]) {
  const pats = names
    .map(name => ({ name, parts: name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean) }))
    .filter(p => p.parts.length > 0)
    .map(p => ({
      name: p.name,
      re:   new RegExp(`(?<![a-z0-9])${p.parts.join('[^a-z0-9]*')}(?![a-z0-9])`, 'i'),
    }));

  return (title: string, tags: string[] = []): string | null => {
    const hay = [title, ...tags].join('\n');
    return pats.find(p => p.re.test(hay))?.name ?? null;
  };
}

/** Kéo 1 feed → lưu bài chưa có. `filterByAuthor` chỉ dùng cho diễn đàn (LET). */
async function syncFeed(source: string, url: string, filterByAuthor: boolean): Promise<SyncResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'dealeg/1.0 (+https://dealeg.com)' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Feed ${source} trả HTTP ${res.status}`);

  const all = parseOfferFeed(await res.text());

  let keep = all;
  if (filterByAuthor) {
    const rows = await prisma.offerSource.findMany({ where: { source, isActive: true }, select: { username: true } });
    const follow = new Set(rows.map(r => r.username.trim().toLowerCase()));
    keep = follow.size === 0 ? [] : all.filter(o => follow.has(o.author.trim().toLowerCase()));
  }

  let created = 0, skipped = 0;
  for (const o of keep) {
    const exists = await prisma.offerPost.findUnique({
      where:  { source_externalId: { source, externalId: o.externalId } },
      select: { id: true },
    });
    if (exists) { skipped++; continue; }        // KHÔNG ghi đè: giữ status người vận hành đã đặt
    await prisma.offerPost.create({ data: { source, ...o } });
    created++;
  }
  return { fetched: all.length, matched: keep.length, created, skipped };
}

/** LET: diễn đàn → chỉ lấy bài của provider đang theo dõi (tác giả CHÍNH LÀ provider). */
export const syncLetOffers = () => syncFeed('lowendtalk', LET_OFFERS_FEED, true);

/** LEB: blog đã được biên tập viên chọn lọc → lấy hết, việc đánh dấu để makeFollowMatcher lo. */
export const syncLebOffers = () => syncFeed('lowendbox', LEB_OFFERS_FEED, false);

/** Kéo cả hai nguồn. Một nguồn lỗi KHÔNG làm hỏng nguồn kia. */
export async function syncAllOffers(): Promise<Record<string, SyncResult | { error: string }>> {
  const out: Record<string, SyncResult | { error: string }> = {};
  for (const [key, fn] of [['lowendtalk', syncLetOffers], ['lowendbox', syncLebOffers]] as const) {
    try { out[key] = await fn(); }
    catch (e) { out[key] = { error: e instanceof Error ? e.message : String(e) }; }
  }
  return out;
}
