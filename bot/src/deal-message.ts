import { InlineKeyboard } from 'grammy';
import type { DealCard } from './api';
import { t } from './i18n';

/** Escape cho parse_mode HTML của Telegram. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function trim(s: string, max: number): string {
  const clean = s.trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/**
 * Deal card gọn theo mẫu mydealz/Pelando: provider + giảm giá + tiêu đề + mã + hạn,
 * kèm nút CTA về dealeg.com (KHÔNG bao giờ link affiliate trực tiếp).
 */
export function renderDeal(deal: DealCard, locale: string): { text: string; keyboard: InlineKeyboard } {
  const lines: string[] = [];

  const head = [`🔥 <b>${esc(deal.provider)}</b>`, deal.discount ? esc(deal.discount) : '']
    .filter(Boolean).join(' · ');
  lines.push(head);

  if (deal.title) lines.push(`<b>${esc(trim(deal.title, 120))}</b>`);
  if (deal.description) lines.push(esc(trim(deal.description, 180)));

  lines.push('');
  lines.push(`🎟 ${t(locale, 'codeLabel')}: <code>${esc(deal.code)}</code>`);
  if (deal.hideCode) lines.push(t(locale, 'exclusive'));

  if (deal.expiresAt) {
    const d = new Date(deal.expiresAt);
    if (!Number.isNaN(d.getTime())) lines.push(`⏰ ${d.toISOString().slice(0, 10)}`);
  }

  lines.push('');
  lines.push(`<i>${esc(t(locale, 'disclosure'))}</i>`);

  const keyboard = new InlineKeyboard().url(t(locale, 'viewDeal'), deal.url);
  return { text: lines.join('\n'), keyboard };
}
