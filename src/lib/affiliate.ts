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
