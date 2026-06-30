# 🔐 Setup NextAuth + Google OAuth cho dealeg.com

Sau khi giải nén, làm theo bước này.

---

## Bước 1 — Cài dependencies + migration DB

```bash
npm install
npm run db:push    # Tạo table User, Account, Session, Comment, Vote
```

---

## Bước 2 — Google OAuth Setup (5 phút)

### 2.1 Tạo Google Cloud Project

1. Vào **https://console.cloud.google.com**
2. Đăng nhập bằng tài khoản Google
3. **New Project** → Name: `dealeg` → Create
4. Chờ project được tạo (1–2 phút)

### 2.2 Enable OAuth 2.0

1. Menu → **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth Client ID**
3. Chọn **Application type: Web application**
4. Dưới **Authorized redirect URIs**, thêm 2 dòng:
   ```
   http://localhost:3000/api/auth/callback/google
   https://dealeg.com/api/auth/callback/google  (sau deploy)
   ```
5. **Create**
6. Sẽ hiện popup với **Client ID** và **Client Secret** → copy lại

### 2.3 Điền vào .env.local

```bash
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"   # Tạo random string 32 ký tự
```

Chạy lệnh này để tạo NEXTAUTH_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Dán output vào `.env.local`.

---

## Bước 3 — Run dev server

```bash
npm run dev
```

Truy cập: **http://localhost:3000**

---

## Bước 4 — Test login

1. Bấm **Đăng nhập** → chọn **Đăng nhập bằng Google**
2. Chọn tài khoản Google → cho phép truy cập
3. Được redirect về trang home
4. Header phải show tên Google của bạn + Đăng xuất

---

## Bước 5 — Test comment & vote

1. Vào provider bất kỳ: **http://localhost:3000/provider/namecheap**
2. Scroll xuống voucher → thấy phần "Xác nhận từ cộng đồng"
3. Nhập comment → bấm "Gửi bình luận"
4. Bấm **✓ Còn** hoặc **✗ Hết** để vote

---

## Các API được tạo

| Endpoint | Method | Chức năng |
|----------|--------|----------|
| `/api/auth/signin` | POST | Login |
| `/api/auth/signout` | POST | Logout |
| `/api/comments` | GET | Lấy comments của voucher |
| `/api/comments` | POST | Thêm comment (cần auth) |
| `/api/comments/[id]` | DELETE | Xoá comment (chỉ author) |
| `/api/comments/[id]/votes` | POST | Vote "Còn" / "Hết" (cần auth) |

---

## Deploy lên Vercel

1. Đẩy code lên GitHub
2. Vercel → Import → chọn repo
3. Environment Variables → thêm:
   - `DATABASE_URL` (Supabase)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL=https://dealeg.com` (sau khi có domain)
4. Deploy

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|---------|
| `AuthError: Configuration error` | NEXTAUTH_SECRET chưa set | Thêm vào .env.local |
| `signin_oauth_callback: undefined is not an object` | Database chưa đúng | Chạy `npm run db:push` |
| `Callback URL mismatch` | URL trong Google OAuth không khớp | Kiểm tra lại Authorized redirect URIs |
| `Session không load` | Chưa wrap SessionProvider | Kiểm tra [locale]/layout.tsx |
