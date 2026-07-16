import { Bot, GrammyError } from 'grammy';
import { config }           from './config';
import { getPending, recordSent, updateUser } from './api';
import { renderDeal }       from './deal-message';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * 1 lượt broadcast: lấy hàng đợi (app đã ghép user×deal + chống trùng) → gửi → báo lại.
 *
 * Giới hạn Telegram (theo nghiên cứu): ~30 msg/s toàn cục, 1 msg/s mỗi chat.
 * Plugin auto-retry đã tự tôn trọng `retry_after` khi dính 429 nên ở đây chỉ cần
 * nghỉ nhẹ giữa các tin, KHÔNG vòng lặp gửi liên tục.
 */
export async function runBroadcast(bot: Bot): Promise<{ sent: number; failed: number }> {
  const pending = await getPending();
  if (pending.length === 0) return { sent: 0, failed: 0 };

  const done: { botUserId: number; dealId: string; channel: string }[] = [];
  let failed = 0;

  for (const p of pending) {
    const { text, keyboard } = renderDeal(p.deal, p.locale);
    try {
      await bot.api.sendMessage(p.chatId, text, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
        link_preview_options: { is_disabled: true },
      });
      done.push({ botUserId: p.botUserId, dealId: p.deal.id, channel: 'bot' });
    } catch (err) {
      failed++;
      // 403 = user đã chặn bot / xoá chat → tắt để khỏi gửi mãi
      if (err instanceof GrammyError && (err.error_code === 403 || err.error_code === 400)) {
        await updateUser({ chatId: p.chatId, isActive: false }).catch(() => {});
        console.warn(`Tắt user ${p.chatId} (Telegram ${err.error_code}: ${err.description})`);
      } else {
        console.error(`Gửi lỗi chat=${p.chatId} deal=${p.deal.id}:`, err instanceof Error ? err.message : err);
      }
    }
    await sleep(config.sendGapMs);
  }

  if (done.length) await recordSent(done).catch(e => console.error('Ghi SentDeal lỗi:', e));
  return { sent: done.length, failed };
}
