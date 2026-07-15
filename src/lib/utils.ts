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

// ─── Affiliate URL builder ────────────────────────────────────────────────────
export function buildAffiliateUrl(base: string, locale: string): string {
  const url = new URL(base);
  url.searchParams.set('ref', 'dealeg');
  url.searchParams.set('locale', locale);
  return url.toString();
}
