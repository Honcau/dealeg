function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
  return v;
}

export const config = {
  /** Token từ BotFather */
  botToken: required('BOT_TOKEN'),

  /** Internal API của app Next.js. Trong Docker Compose: http://app:3000 */
  apiBase:  (process.env.INTERNAL_API_BASE ?? 'http://app:3000').replace(/\/+$/, ''),
  apiToken: required('INTERNAL_API_TOKEN'),

  /**
   * Webhook (production). Ví dụ: https://bot.dealeg.com/telegram/<đường-dẫn-bí-mật>
   * Không set → bot chạy long-polling (tiện cho dev máy local).
   */
  webhookUrl:    process.env.BOT_WEBHOOK_URL ?? '',
  /** Gửi kèm header X-Telegram-Bot-Api-Secret-Token để chống giả mạo update */
  webhookSecret: process.env.BOT_WEBHOOK_SECRET ?? '',
  port:          Number(process.env.PORT ?? 8080),

  /** Chu kỳ quét deal mới rồi gửi (mặc định 10 phút — theo nghiên cứu: 5–15 phút) */
  pollIntervalMs: Number(process.env.BOT_POLL_INTERVAL_MS ?? 10 * 60 * 1000),

  /** Nghỉ giữa 2 tin nhắn khi broadcast (~29 msg/s < mức 30/s của Telegram) */
  sendGapMs: Number(process.env.BOT_SEND_GAP_MS ?? 35),

  siteUrl:    (process.env.SITE_URL ?? 'https://dealeg.com').replace(/\/+$/, ''),
  privacyUrl: process.env.BOT_PRIVACY_URL ?? '',
};

export const useWebhook = Boolean(config.webhookUrl);
