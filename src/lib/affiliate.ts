/**
 * Né việc adblock chặn cú click-through affiliate.
 *
 * CJ (Commission Junction) xoay vòng nhiều domain redirect TƯƠNG ĐƯƠNG NHAU, nhưng
 * EasyList/EasyPrivacy chặn chúng KHÁC nhau (đối chiếu 2026-07):
 *   - Nhóm AN TOÀN — luật `||domain^$third-party`: chỉ chặn khi domain bị nhúng làm
 *     pixel/script bên thứ ba. Cú điều hướng Get Code cấp cao nhất KHÔNG dính.
 *     → tkqlhce.com · anrdoezrs.net · dpbolvw.net · apmebf.com
 *   - Nhóm CHẶN SẠCH — luật `||domain^` trần: chặn mọi request kể cả điều hướng cấp
 *     cao nhất → 302 Get Code chết với user bật uBlock/AdBlock/Brave.
 *     → jdoqocy.com · kqzyfj.com · ftjcfx.com · lduhtrp.net · awltovhc.com · qksrv.net · afcyhf.com
 *
 * Vì các domain CJ hoán đổi được, ta viết lại host "chặn sạch" sang host "an toàn".
 *
 * ⚠ CHỈ đổi cho link dạng PID-AID (`/click-<PID>-<AID>`): dạng này đổi host là tương
 * đương, an toàn cho MỌI user. KHÔNG đụng link mã hoá (token `/3j77y1A...` có thể gắn
 * cứng với domain — đổi host sẽ hỏng cho cả user không adblock). Link mã hoá trên
 * domain chặn sạch thì nên tạo lại ở dạng PID-AID, đừng vá ở đây.
 */
const CJ_HARD_BLOCKED = new Set([
  'jdoqocy.com', 'kqzyfj.com', 'ftjcfx.com', 'lduhtrp.net',
  'awltovhc.com', 'qksrv.net', 'afcyhf.com',
]);
const CJ_SAFE_HOST = 'www.anrdoezrs.net';
const CJ_PID_AID = /^\/click-\d+-\d+(\/|$|\?)/;   // /click-PID-AID[...]

/** Đổi host CJ bị chặn sạch → host CJ an toàn, chỉ khi link ở dạng PID-AID. Mutate & trả lại u. */
export function dodgeBlockedAffiliateHost(u: URL): URL {
  const bare = u.hostname.replace(/^www\./i, '').toLowerCase();
  if (CJ_HARD_BLOCKED.has(bare) && CJ_PID_AID.test(u.pathname)) {
    u.hostname = CJ_SAFE_HOST;
  }
  return u;
}

/**
 * Voucher này có dẫn được người dùng ra ngoài không? Trả link đích, hoặc null.
 *
 * DÙNG CHUNG cho 4 nơi phải đồng ý với nhau: thẻ voucher (quyết định render
 * <a href="/api/go/..."> hay <button> trơ), /api/go, và 2 cảnh báo trong admin.
 * Trước đây mỗi nơi tự viết lại điều kiện — badge "chưa có link" mà lệch với hành vi
 * thật thì còn tệ hơn không có badge.
 *
 * Thứ tự ưu tiên: affiliateUrl (link kiếm tiền) trước, '#' coi như chưa có; sourceUrl sau.
 */
export function outboundTarget(
  v: { affiliateUrl?: string | null; sourceUrl?: string | null },
): string | null {
  const aff = v.affiliateUrl?.trim();
  if (aff && aff !== '#') return aff;
  return v.sourceUrl?.trim() || null;
}

/** Tình trạng link affiliate của 1 voucher khi so với link sắp áp. */
export type LinkState =
  | 'missing'    // chưa có link affiliate → voucher không ra hoa hồng
  | 'same'       // đã đúng link sắp áp → không cần làm gì
  | 'different'; // đang dùng link KHÁC — rất có thể là deep-link cố ý, đừng đè mù

/**
 * So link affiliate hiện tại của voucher với link sắp áp.
 *
 * CHỈ xét `affiliateUrl` (không xét `sourceUrl`): màn hình đồng bộ chỉ ghi đè
 * affiliateUrl, và một voucher chỉ có link gốc thì vẫn coi là CHƯA có link kiếm tiền.
 */
export function classifyVoucherLink(
  v: { affiliateUrl?: string | null },
  applyUrl: string,
): LinkState {
  const cur = v.affiliateUrl?.trim();
  if (!cur || cur === '#') return 'missing';
  return cur === applyUrl.trim() ? 'same' : 'different';
}
