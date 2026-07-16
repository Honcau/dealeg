# Telegram deal-alert bot — Setup

Bot Telegram **đa ngôn ngữ** (1 bot phục vụ cả 12 locale) gửi deal mới từ dealeg.com.
Kiến trúc theo bản nghiên cứu: grammY + webhook, chạy là service Docker riêng, lấy dữ liệu
qua **internal API** của app (không cần credential DB), và **mọi link đều trỏ về dealeg.com**
(không bao giờ đưa link affiliate thẳng vào tin nhắn — quy tắc của Amazon Associates).

```
Telegram ──webhook──► Nginx (bot.dealeg.com) ──► container bot ──HTTP+token──► app (Next.js) ──► Postgres
```

---

## 1. Tạo bot với BotFather

1. Chat với [@BotFather](https://t.me/BotFather) → `/newbot` → đặt tên + username (kết thúc bằng `bot`).
2. Lưu **token** (dạng `123456:ABC-...`).
3. Tuỳ chọn: `/setdescription`, `/setabouttext`, `/setuserpic`.
   (Danh sách lệnh `/start /deals /language /stop /help` bot **tự đăng ký** lúc khởi động.)

## 2. DNS + SSL cho webhook

```bash
# DNS: thêm A record  bot.dealeg.com → IP VPS  (Cloudflare proxy bật được)
sudo certbot --nginx -d bot.dealeg.com
```
Nginx đã có sẵn server block `bot.dealeg.com` trong `deploy/nginx.conf` (chỉ mở `/telegram/` và `/health`).

## 3. Biến môi trường (`.env.production`)

```bash
openssl rand -hex 32   # → INTERNAL_API_TOKEN
openssl rand -hex 16   # → BOT_WEBHOOK_SECRET
openssl rand -hex 16   # → chuỗi bí mật trong BOT_WEBHOOK_URL
```

```env
INTERNAL_API_TOKEN="<hex32>"                                  # app <-> bot
NEXT_PUBLIC_SITE_URL="https://dealeg.com"                     # dùng dựng link deal
BOT_TOKEN="<token BotFather>"
BOT_WEBHOOK_URL="https://bot.dealeg.com/telegram/<hex16>"     # trống = long-polling (dev)
BOT_WEBHOOK_SECRET="<hex16>"                                  # header chống giả mạo update
BOT_PRIVACY_URL="https://dealeg.com/en/privacy"
BOT_POLL_INTERVAL_MS="600000"                                 # quét deal mới mỗi 10 phút
```

> `BOT_TOKEN` trống → `deploy.sh` **bỏ qua** service bot (compose profile `bot`), web chạy bình thường.

## 4. Deploy

```bash
cd /home/dealeg && ./deploy/deploy.sh     # tự db push (BotUser/SentDeal) + build + bật bot khi có BOT_TOKEN
sudo nginx -t && sudo systemctl reload nginx
```

Kiểm tra:
```bash
docker compose --profile bot logs -f bot          # "Đã đăng ký webhook: ..."
curl -s https://bot.dealeg.com/health             # ok
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"   # url đúng, pending_update_count thấp
```
Rồi mở bot trên Telegram → `/start`.

## 5. Chạy local (dev)

```bash
cd bot && npm install
BOT_TOKEN=xxx INTERNAL_API_TOKEN=<trùng .env của app> INTERNAL_API_BASE=http://localhost:3000 \
  npm run build && npm start        # không set BOT_WEBHOOK_URL → long-polling
```

---

## Cách hoạt động

| Thành phần | Vai trò |
|---|---|
| `bot/src/index.ts` | lệnh `/start` `/language` `/stop` `/help` `/deals`, webhook/polling, hẹn giờ broadcast |
| `bot/src/broadcast.ts` | mỗi 10 phút: lấy hàng đợi → gửi → báo lại. `auto-retry` tự tôn trọng `retry_after` khi 429 |
| `bot/src/i18n.ts` | 11 chuỗi × 12 ngôn ngữ |
| `GET /api/internal/bot/pending` | app ghép user × deal mới, lọc danh mục, **loại deal đã gửi** |
| `POST /api/internal/bot/sent` | ghi `SentDeal` → không gửi trùng (idempotent, retry an toàn) |
| `GET/POST/PATCH /api/internal/bot/users` | opt-in, đổi locale, `/stop` |
| `GET /api/internal/deals` | nguồn deal đã localize (dùng cho `/deals`) |

**Ngôn ngữ:** `/start` đoán từ `language_code` của Telegram → lưu `BotUser.locale` → user đổi lại bằng `/language`. Mỗi tin nhắn gửi đúng ngôn ngữ đã lưu.

**Attribution:** deep link `t.me/<bot>?start=de_homepage` → payload lưu vào `BotUser.source`.

**Deal ẩn mã (`hideCode`):** internal API chỉ trả mã đã mask (`BOTE••••`) — bot không bao giờ phát tán mã độc quyền; user phải mở trang để xem đủ.

## Bảo mật & tuân thủ

- `/api/internal/*` cần `Authorization: Bearer $INTERNAL_API_TOKEN` (so sánh constant-time) **và** bị Nginx chặn từ Internet — bot gọi qua mạng nội bộ Docker `http://app:3000`.
- Webhook xác thực bằng `X-Telegram-Bot-Api-Secret-Token`; container bot chỉ listen `127.0.0.1:8080`.
- **GDPR:** `/start` = opt-in rõ ràng, có link chính sách bảo mật; `/stop` tắt ngay; xoá `BotUser` là xoá luôn lịch sử gửi (cascade). Chỉ lưu chatId + locale + prefs + mốc opt-in.
- **Affiliate:** disclosure hiện ở `/start` và chân mỗi deal; link luôn về dealeg.com.

## Giới hạn tốc độ

Telegram: ~30 msg/s toàn cục, 1 msg/s mỗi chat. Bot nghỉ `BOT_SEND_GAP_MS` (35ms ≈ 29/s) giữa các tin
và dùng `@grammyjs/auto-retry` để tự đợi khi dính 429. Broadcast cho hàng nghìn user là việc **kéo dài nhiều phút/giờ**, không tức thì.

## Bước tiếp theo (chưa làm — theo lộ trình nghiên cứu)

- **Phase 2:** lọc theo danh mục (`/categories`), digest ngày vs tức thì, quiet hours (schema `BotUser` đã có sẵn field); Channel công khai theo ngôn ngữ (de/en/ja…) để tăng khám phá; widget "Join on Telegram" trên site + cross-promo qua newsletter.
- **Phase 3:** hàng đợi Redis/BullMQ khi vượt ~2.000–5.000 user; đánh giá LINE (Nhật) / KakaoTalk (Hàn) — đều tốn phí, chỉ làm khi ja/ko đã chứng minh doanh thu.
- **Không làm:** bot Facebook Messenger (cấm nội dung khuyến mãi) và WhatsApp Business API (tính phí mỗi tin).
