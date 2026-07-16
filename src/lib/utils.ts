// ─── CSS class helper ─────────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function isExpired(date?: Date): boolean {
  if (!date) return false;
  return new Date() > date;
}

export function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Number helpers ───────────────────────────────────────────────────────────
export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/**
 * Ẩn 1 phần mã voucher (deal độc quyền): hiện ~40% ký tự đầu, phần còn lại thay bằng chấm.
 * Chỉ để nhử người dùng bấm "Nhận mã" — mã đầy đủ sẽ lộ sau khi bấm.
 */
export function maskVoucherCode(code: string): string {
  if (!code) return '';
  if (code.length <= 3) return '••••';
  const keep = Math.max(2, Math.round(code.length * 0.4));
  return code.slice(0, keep) + '••••';
}

/**
 * Ghi nhận 1 lượt click "Nhận mã" (tăng useCount). Chỉ gọi từ client component.
 *
 * Dùng sendBeacon thay vì fetch: trình duyệt CAM KẾT gửi request kể cả khi tab
 * vừa bị đẩy xuống nền hoặc đóng ngay sau đó — fetch thường có thể bị huỷ giữa
 * chừng khi điều hướng (hay gặp trên mobile). Fallback fetch keepalive cho
 * trình duyệt cũ không có sendBeacon.
 */
export function trackVoucherClick(voucherId: string): void {
  const url = `/api/vouchers/${voucherId}/click`;
  try {
    if (navigator.sendBeacon?.(url)) return;
  } catch { /* sendBeacon lỗi → rơi xuống fetch */ }
  fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
}

/**
 * Copy text vào clipboard, trả về true nếu chắc chắn copy được.
 *
 * Vì sao không chỉ dùng navigator.clipboard: trong IN-APP BROWSER (Telegram, Facebook,
 * Instagram, Zalo...) Clipboard API thường KHÔNG tồn tại hoặc bị từ chối quyền → mã
 * không hề được copy dù ta báo "đã copy". document.execCommand tuy deprecated nhưng
 * vẫn chạy tốt ở mọi trình duyệt kể cả webview, và nó ĐỒNG BỘ nên giữ được user-gesture.
 *
 * PHẢI gọi trực tiếp trong event handler (không await gì trước đó) — hết gesture là hỏng.
 */
export function copyToClipboard(text: string): boolean {
  // 1. execCommand — đồng bộ, biết kết quả ngay, chạy được trong webview
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);   // iOS cần dòng này mới select được
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) return true;
  } catch { /* rơi xuống Clipboard API */ }

  // 2. execCommand fail (hiếm) → thử Clipboard API. Không await để giữ gesture.
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      return true;
    }
  } catch { /* ignore */ }

  return false;
}

/**
 * Đoán xem có đang chạy trong in-app browser (webview) hay không.
 *
 * Quan trọng vì webview KHÔNG có tab: <a target="_blank"> thường không mở được gì,
 * tap vào là chết lặng. Phát hiện được thì ta điều hướng ngay trong webview.
 *
 * Dựa vào user-agent nên không thể chính xác 100% (Telegram không tự khai tên trong UA
 * trên Android — chỉ nhận ra được qua token WebView "wv"). Đoán nhầm thì hậu quả nhẹ:
 * link mở cùng khung thay vì tab mới.
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';

  // Các app tự khai tên trong UA
  if (/FBAN|FBAV|FB_IAB|Instagram|Line\/|KAKAOTALK|Snapchat|Pinterest|MicroMessenger|Zalo|Twitter/i.test(ua)) {
    return true;
  }
  // Android WebView — Telegram và đa số in-app browser Android dùng cái này
  if (/;\s*wv[;)]/i.test(ua) || /\bwv\b/.test(ua)) return true;
  // iOS WKWebView: có AppleWebKit nhưng THIẾU token "Safari/" (Safari thật luôn có)
  if (/(iPhone|iPod|iPad)/.test(ua) && /AppleWebKit/.test(ua) && !/Safari\//.test(ua)) return true;

  return false;
}

// ─── Affiliate URL builder ────────────────────────────────────────────────────
export function buildAffiliateUrl(base: string, locale: string): string {
  const url = new URL(base);
  url.searchParams.set('ref', 'dealeg');
  url.searchParams.set('locale', locale);
  return url.toString();
}
