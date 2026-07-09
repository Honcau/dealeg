# Deploy dealeg lên Netlify

Hướng dẫn này liệt kê những bước **thủ công** bạn phải làm (code đã sửa xong).

---

## 1. Biến môi trường trên Netlify

Vào **Site settings → Environment variables**, thêm TRƯỚC lần deploy đầu:

| Biến | Giá trị |
|---|---|
| `DATABASE_URL` | Supabase **Transaction pooler** (port **6543**) + `?pgbouncer=true&connection_limit=1` |
| `NEXTAUTH_SECRET` | tạo bằng `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | từ Google Cloud Console |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | từ Facebook Developers |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | từ GitHub OAuth Apps |
| `DEEPL_API_KEY` | key DeepL (kết thúc `:fx` nếu free) |
| `ADMIN_SECRET` | mật khẩu admin panel |
| `NAMECHEAP_AFFILIATE_ID` / `HOSTINGER_AFFILIATE_ID` / `NORDVPN_AFFILIATE_ID` | (nếu có) |

> **Quan trọng — connection string:** Trên serverless mỗi request có thể mở 1 kết nối mới.
> Dùng **pooler (6543)** cho `DATABASE_URL` trên Netlify để không cạn kết nối Supabase.
> Lấy tại: Supabase → Project → Settings → Database → Connection string → chọn **Transaction**.
>
> Riêng máy local và GitHub Actions thì dùng **connection trực tiếp (port 5432)**.

---

## 2. Deploy

1. Code đã ở GitHub (`Honcau/dealeg`) — chỉ cần push nhánh mới nhất.
2. Netlify → **Add new site → Import an existing project** → chọn repo `dealeg`.
3. Build settings tự nhận diện từ `netlify.toml` (không cần chỉnh tay).
4. Thêm hết biến môi trường ở bước 1.
5. Bấm **Deploy**. Build đầu ~2–4 phút.

---

## 3. Cập nhật OAuth callback (bắt buộc, nếu không sẽ không đăng nhập được)

Sau khi có domain Netlify (vd `dealeg-xyz.netlify.app`), vào console từng provider và **thêm** redirect URI mới (giữ luôn cái localhost để dev):

- **Google** (Cloud Console → OAuth Client → Authorized redirect URIs):
  `https://dealeg-xyz.netlify.app/api/auth/callback/google`
- **Facebook** (Facebook Login → Settings → Valid OAuth Redirect URIs):
  `https://dealeg-xyz.netlify.app/api/auth/callback/facebook`
- **GitHub** (OAuth App → Authorization callback URL):
  `https://dealeg-xyz.netlify.app/api/auth/callback/github`

> Khi gắn domain riêng (vd `dealeg.com`), thêm tiếp URI với domain đó.

---

## 4. Những gì đã đổi trong code

| File | Thay đổi |
|---|---|
| `package.json` | thêm `postinstall: prisma generate` (Netlify cache deps → phải generate lại) |
| `prisma/schema.prisma` | thêm `binaryTargets` cho runtime Lambda của Netlify |
| `src/app/api/auth/[...nextauth]/route.ts` | thêm `trustHost: true` (fix lỗi `UntrustedHost`) |
| `src/lib/translation.ts` | tách hàm dịch **theo từng ngôn ngữ** (`translateArticleLocale`) |
| `src/app/api/admin/articles/[id]/translate/route.ts` | nhận `{ locale }` → dịch 1 ngôn ngữ/lần |
| `src/app/admin/(dashboard)/articles/page.tsx` | nút "Dịch" gọi lần lượt 11 ngôn ngữ (hiện tiến độ) |
| `netlify.toml` | **mới** — cấu hình build |
| `vercel.json` | **đã xoá** |

### Vì sao tách dịch theo từng ngôn ngữ?
Bản cũ dịch 11 ngôn ngữ tuần tự trong 1 request (~30–60s) — hợp với Vercel Pro (maxDuration 300s)
nhưng **vượt timeout Netlify** (free 10s / Pro 26s). Giờ mỗi request chỉ dịch 1 ngôn ngữ (~3–6s),
admin UI tự lặp qua đủ 11 ngôn ngữ và hiển thị `Dịch 3/11...`. Nếu 1 ngôn ngữ lỗi, chỉ ngôn ngữ đó
báo lỗi, bấm "Dịch" lại để dịch nốt phần còn thiếu.
