# 🚀 Hướng dẫn cài đặt dealeg.com từ đầu

> Dành cho người mới bắt đầu — đọc từng bước, làm theo tuần tự.

---

## Bước 1 — Cài Node.js (nếu chưa có)

Vào https://nodejs.org → tải bản **LTS** → cài đặt.

Kiểm tra thành công:
```bash
node -v   # phải ra v20 trở lên
npm -v
```

---

## Bước 2 — Cài dependencies dự án

```bash
# Giải nén file zip vào thư mục, rồi vào trong
cd dealeg

# Cài tất cả thư viện
npm install
```

---

## Bước 3 — Tạo database miễn phí trên Supabase

1. Vào **https://supabase.com** → Sign up miễn phí bằng GitHub
2. Nhấn **New project**
   - Organization: chọn tổ chức của bạn
   - Name: `dealeg`
   - Database password: nhập mật khẩu mạnh, **lưu lại ngay**
   - Region: chọn **Southeast Asia (Singapore)** — gần Việt Nam nhất
3. Chờ 1–2 phút project được tạo
4. Vào **Settings → Database → Connection string**
5. Chọn tab **URI** → copy đường dẫn (bắt đầu bằng `postgresql://...`)

---

## Bước 4 — Tạo file cấu hình .env.local

```bash
# Trong thư mục dealeg, copy file mẫu
cp .env.example .env.local
```

Mở file `.env.local` bằng VS Code hoặc Notepad, sửa dòng:
```
DATABASE_URL="postgresql://postgres:MẬT_KHẨU_CỦA_BẠN@db.xxx.supabase.co:5432/postgres"
```
*(dán đúng link đã copy từ Supabase ở bước 3)*

Tạo CRON_SECRET ngẫu nhiên (chạy lệnh này trong terminal):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy kết quả → dán vào `CRON_SECRET=` trong `.env.local`

---

## Bước 5 — Đẩy schema lên database và seed data mẫu

```bash
# Tạo bảng trong Supabase theo schema Prisma
npm run db:push

# Thêm dữ liệu mẫu (6 vouchers + 6 providers)
npm run db:seed
```

Thấy `✅ Seed complete!` là thành công.

---

## Bước 6 — Chạy thử trên máy

```bash
npm run dev
```

Mở trình duyệt: **http://localhost:3000**

Website sẽ tự chuyển sang http://localhost:3000/vi (tiếng Việt mặc định).

Thử đổi ngôn ngữ: http://localhost:3000/ar (tiếng Ả Rập, layout tự đổi RTL)

---

## Bước 7 — Deploy lên Vercel (miễn phí)

### 7.1 Đưa code lên GitHub

```bash
# Khởi tạo Git (chỉ làm 1 lần)
git init
git add .
git commit -m "feat: initial dealeg.com boilerplate"

# Tạo repo trên github.com → copy URL dạng https://github.com/TEN/dealeg.git
git remote add origin https://github.com/TEN/dealeg.git
git push -u origin main
```

### 7.2 Deploy Vercel

1. Vào **https://vercel.com** → Sign up bằng GitHub
2. Nhấn **Add New → Project**
3. Chọn repo `dealeg` vừa tạo → nhấn **Import**
4. Framework: Vercel tự detect là **Next.js** ✅
5. Mở mục **Environment Variables** → thêm từng dòng trong `.env.local` của bạn:
   - `DATABASE_URL` → dán giá trị
   - `CRON_SECRET` → dán giá trị
   - (các affiliate ID nếu đã có)
6. Nhấn **Deploy** → chờ 2–3 phút

Website sẽ có URL dạng: `https://dealeg-xxx.vercel.app`

### 7.3 Gắn domain dealeg.com

1. Vercel → project → **Settings → Domains**
2. Nhập `dealeg.com` → nhấn Add
3. Vercel sẽ hướng dẫn thêm DNS record vào nơi bạn mua domain
4. Chờ 5–30 phút để DNS propagate

---

## Bước 8 — Test cron scraper

Sau khi deploy, truy cập (thay secret của bạn):
```
https://dealeg.com/api/cron/scrape
Authorization: Bearer YOUR_CRON_SECRET
```

Hoặc dùng curl:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://dealeg.com/api/cron/scrape
```

Vercel sẽ tự gọi endpoint này mỗi 6 giờ theo lịch trong `vercel.json`.

---

## Thêm voucher thủ công (khi chưa scraper tự động)

Chạy Prisma Studio — giao diện quản lý DB đẹp, không cần code:
```bash
npm run db:studio
```

Mở http://localhost:5555 → nhấn vào bảng `Voucher` → nhấn `Add record`

---

## Cấu trúc thư mục quan trọng

```
src/
├── app/[locale]/
│   ├── page.tsx              ← Trang chủ (dùng DB thật)
│   ├── category/[category]/
│   │   └── page.tsx          ← /domain /hosting /vpn /cdn...
│   ├── submit/page.tsx       ← Form submit voucher
│   └── tools/page.tsx        ← Trang công cụ (Phase 2)
├── components/voucher/
│   ├── VoucherCard.tsx       ← 1 card voucher
│   ├── VoucherGrid.tsx       ← Lưới vouchers
│   └── VoucherFilter.tsx     ← Bộ lọc + sắp xếp
├── lib/
│   ├── db.ts                 ← Prisma client
│   └── scrapers/
│       ├── index.ts          ← Chạy tất cả scrapers
│       ├── namecheap.ts      ← Scraper Namecheap
│       ├── hostinger.ts      ← Scraper Hostinger
│       └── nordvpn.ts        ← Scraper NordVPN
└── app/api/
    ├── vouchers/route.ts         ← GET danh sách voucher
    ├── vouchers/submit/route.ts  ← POST submit voucher mới
    └── cron/scrape/route.ts      ← GET chạy scraper (cron)

prisma/
├── schema.prisma             ← Cấu trúc database
└── seed.ts                   ← Data mẫu ban đầu

vercel.json                   ← Cấu hình deploy + cron
```

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `PrismaClientInitializationError` | Sai DATABASE_URL | Kiểm tra lại .env.local |
| `relation "Voucher" does not exist` | Chưa chạy db:push | Chạy `npm run db:push` |
| `Cannot find module '@prisma/client'` | Chưa generate | Chạy `npx prisma generate` |
| Port 3000 đã dùng | App khác đang chạy | Thêm `-p 3001` vào lệnh dev |
| Vercel build fail | Thiếu env var | Kiểm tra Environment Variables trên Vercel |

---

## Bước tiếp theo sau khi website chạy

- **Thêm scraper mới**: copy `src/lib/scrapers/nordvpn.ts` → đổi tên → import vào `scrapers/index.ts`
- **Fine-tune selectors**: mở F12 trên website cần scrape → tìm CSS class chứa coupon code → cập nhật trong scraper tương ứng
- **Duyệt submission**: vào Prisma Studio → bảng `VoucherSubmission` → đổi `status` từ `PENDING` sang `APPROVED`
- **Phase 2**: triển khai ilovepdf, OnlyOffice theo README.md
