# 🎯 dealeg.com — Feature List

## Phase 1 ✅ (Xong)

- [x] **Boilerplate** — Next.js 15, TypeScript, Tailwind, 12 ngôn ngữ
- [x] **Database** — PostgreSQL (Supabase) + Prisma ORM
- [x] **Trang chủ** — Featured vouchers từ DB
- [x] **Category pages** — Filter, sort, pagination per category
- [x] **Form submit voucher** — User tự submit deal
- [x] **Admin panel** — CRUD voucher, quản lý toàn bộ
- [x] **Scraper skeleton** — Cheerio + fallback
- [x] **NextAuth + Google OAuth** — Đăng nhập bằng Google
- [x] **Community comments** — User comment xác nhận voucher còn dùng
- [x] **Voting system** — Vote "Còn dùng" hoặc "Đã hết hạn"
- [x] **Provider detail page** — `/provider/[slug]` hiển thị tất cả deal

---

## Phase 2 🚀 (Tiếp theo)

### Scraper + Impact.com Integration
- [ ] Tích hợp Impact.com API (khi được duyệt)
- [ ] Fine-tune CSS selectors coupert.com + dealhack.com
- [ ] Cron job tự động chạy 6h/lần trên Vercel
- [ ] Email alert khi có voucher mới

### Tools
- [ ] **PDF Editor** — ilovepdf API (upload, compress, merge)
- [ ] **Office Editor** — OnlyOffice (chỉnh sửa .docx .xlsx .pptx)
- [ ] **Image Editor** — Photopea embed
- [ ] **File Converter** — CloudConvert API

### Social Features
- [ ] Bookmark/Save deal (lưu vào profile)
- [ ] Follow provider (nhận notif khi có deal mới)
- [ ] Telegram bot — gửi voucher hàng ngày
- [ ] Zalo Official Account

### Analytics
- [ ] Dashboard admin — stats voucher, user, comment
- [ ] Coupon success rate tracking
- [ ] Most voted deals leaderboard

---

## Phase 3 📈 (Dài hạn)

- [ ] **Browser extension** — Auto-apply coupon khi checkout (như Honey)
- [ ] **Price history chart** — Biểu đồ giá domain/hosting theo thời gian
- [ ] **API công khai** — Để dev tích hợp dealeg vào app của mình
- [ ] **Mobile app** — React Native / Flutter
- [ ] **Embeddable widget** — Tech blog nhúng deal vào bài viết
- [ ] **Community submit + moderation queue** — User tự duyệt voucher

---

## Current Tech Stack

```
Frontend:     Next.js 15 + TypeScript + Tailwind + next-intl
Backend:      Node.js (API routes)
Database:     PostgreSQL (Supabase)
ORM:          Prisma
Auth:         NextAuth.js + Google OAuth
Scraping:     Cheerio + Playwright (fallback)
Hosting:      Vercel (frontend) + Supabase (DB)
```

---

## Metrics to Track

- Active users (monthly)
- Voucher submission rate
- Most popular provider
- Highest voted comment
- Scraper uptime

---

**Last updated:** Jan 2025
