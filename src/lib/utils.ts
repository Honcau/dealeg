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

// ─── Affiliate URL builder ────────────────────────────────────────────────────
export function buildAffiliateUrl(base: string, locale: string): string {
  const url = new URL(base);
  url.searchParams.set('ref', 'dealeg');
  url.searchParams.set('locale', locale);
  return url.toString();
}
