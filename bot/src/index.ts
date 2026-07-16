import { Bot, Context, InlineKeyboard, webhookCallback } from 'grammy';
import { autoRetry }     from '@grammyjs/auto-retry';
import { createServer }  from 'http';
import { config, useWebhook } from './config';
import { t, normalizeLocale, LANGUAGE_BUTTONS } from './i18n';
import { getUser, upsertUser, updateUser, getDeals } from './api';
import { renderDeal }    from './deal-message';
import { runBroadcast }  from './broadcast';

const bot = new Bot(config.botToken);

// Tự đợi & thử lại khi dính 429 (tôn trọng retry_after) — cách xử lý flood limit
// mà tài liệu grammY khuyến nghị, thay vì tự bóp tốc độ.
bot.api.config.use(autoRetry({ maxRetryAttempts: 3, maxDelaySeconds: 60 }));

/** Cache locale trong RAM để không phải gọi API mỗi tin nhắn. */
const localeCache = new Map<string, string>();

async function localeOf(ctx: Context): Promise<string> {
  const chatId = String(ctx.from?.id ?? ctx.chat?.id ?? '');
  const cached = localeCache.get(chatId);
  if (cached) return cached;
  const user = await getUser(chatId);
  const locale = user?.locale ?? normalizeLocale(ctx.from?.language_code);
  localeCache.set(chatId, locale);
  return locale;
}

function languageKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard();
  LANGUAGE_BUTTONS.forEach((b, i) => {
    kb.text(b.label, `lang:${b.code}`);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

// ── /start: opt-in + thông báo riêng tư + disclosure + bắt payload deep-link ──
bot.command('start', async ctx => {
  const chatId  = String(ctx.from!.id);
  const payload = ctx.match?.toString().trim() || undefined;   // t.me/Bot?start=<payload>
  const guess   = normalizeLocale(ctx.from?.language_code);

  const user = await upsertUser({ chatId, locale: guess, source: payload });
  localeCache.set(chatId, user.locale);
  const l = user.locale;

  const privacy = config.privacyUrl ? `\n${config.privacyUrl}` : '';
  await ctx.reply(`${t(l, 'welcome')}\n\n${t(l, 'privacyNote')}${privacy}\n\n${t(l, 'disclosure')}`);
  await ctx.reply(t(l, 'chooseLanguage'), { reply_markup: languageKeyboard() });
});

// ── /language ────────────────────────────────────────────────────────────────
bot.command('language', async ctx => {
  const l = await localeOf(ctx);
  await ctx.reply(t(l, 'chooseLanguage'), { reply_markup: languageKeyboard() });
});

bot.callbackQuery(/^lang:(.+)$/, async ctx => {
  const code   = ctx.match[1];
  const chatId = String(ctx.from.id);
  await updateUser({ chatId, locale: code }).catch(() => {});
  localeCache.set(chatId, code);
  const label = LANGUAGE_BUTTONS.find(b => b.code === code)?.label ?? code;
  await ctx.answerCallbackQuery();
  await ctx.reply(t(code, 'languageSet', { lang: label }));
});

// ── /stop: opt-out phải dễ như opt-in (GDPR) ─────────────────────────────────
bot.command('stop', async ctx => {
  const chatId = String(ctx.from!.id);
  const l = await localeOf(ctx);
  await updateUser({ chatId, isActive: false }).catch(() => {});
  await ctx.reply(t(l, 'stopped'));
});

bot.command('help', async ctx => {
  await ctx.reply(t(await localeOf(ctx), 'help'));
});

// ── /deals: xem deal mới nhất theo yêu cầu ───────────────────────────────────
bot.command('deals', async ctx => {
  const l = await localeOf(ctx);
  const deals = await getDeals(l, 3);
  if (deals.length === 0) {
    await ctx.reply(t(l, 'noDeals'));
    return;
  }
  for (const d of deals) {
    const { text, keyboard } = renderDeal(d, l);
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
      link_preview_options: { is_disabled: true },
    });
  }
});

bot.catch(err => console.error('Bot error:', err.error));

async function main() {
  await bot.api.setMyCommands([
    { command: 'start',    description: 'Get deal alerts' },
    { command: 'deals',    description: 'Latest deals' },
    { command: 'language', description: 'Change language' },
    { command: 'stop',     description: 'Unsubscribe' },
    { command: 'help',     description: 'Help' },
  ]);

  // Cron nội bộ: cứ N phút quét deal mới rồi gửi (mẫu mydealz — không cần hạ tầng thêm)
  setInterval(() => {
    runBroadcast(bot)
      .then(r => { if (r.sent || r.failed) console.log(`Broadcast: gửi ${r.sent}, lỗi ${r.failed}`); })
      .catch(e => console.error('Broadcast lỗi:', e));
  }, config.pollIntervalMs);

  if (useWebhook) {
    const path    = new URL(config.webhookUrl).pathname;
    const handler = webhookCallback(bot, 'http', {
      secretToken: config.webhookSecret || undefined,
    });

    createServer((req, res) => {
      if (req.url === '/health') { res.writeHead(200); res.end('ok'); return; }
      if (req.url === path) { void handler(req, res); return; }
      res.writeHead(404); res.end();
    }).listen(config.port, () => console.log(`Bot webhook nghe cổng ${config.port}, path ${path}`));

    await bot.api.setWebhook(config.webhookUrl, {
      secret_token: config.webhookSecret || undefined,
      drop_pending_updates: false,
    });
    console.log(`Đã đăng ký webhook: ${config.webhookUrl}`);
  } else {
    await bot.api.deleteWebhook();
    console.log('Chạy long-polling (dev)');
    void bot.start();
  }
}

main().catch(e => { console.error('Bot không khởi động được:', e); process.exit(1); });
