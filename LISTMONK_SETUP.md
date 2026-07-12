# Listmonk Setup (v6.2.0) — Phase 0 Email Infrastructure

Hướng dẫn dựng **Listmonk v6.2.0** (email list manager) cho dealeg theo bản nghiên cứu
growth. dealeg chỉ là proxy: form đăng ký → `/api/newsletter` → Listmonk API.
Listmonk lo **double opt-in, welcome email, preference center, gửi campaign**.

> Đây là các bước **thủ công trên VPS** (code phía dealeg đã xong). Làm 1 lần.

---

## 1. Tạo database cho Listmonk (PostgreSQL trên host)

Listmonk dùng PostgreSQL sẵn có trên VPS (DB riêng, tách khỏi dealeg):

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE listmonk;
CREATE USER listmonk WITH ENCRYPTED PASSWORD 'DAT_MAT_KHAU_MANH';
GRANT ALL PRIVILEGES ON DATABASE listmonk TO listmonk;
ALTER DATABASE listmonk OWNER TO listmonk;
SQL
```

Đảm bảo Postgres cho phép container kết nối (giống dealeg — xem DEPLOY_CONTABO.md
Bước 2: `listen_addresses='*'` + dòng `pg_hba.conf` cho dải Docker `172.16.0.0/12`).

## 2. Cấu hình DB password (qua env — KHÔNG sửa config.toml)

`config.toml` giờ **không chứa secret** (không cần sửa gì — nên pull code sau này
không xung đột). Password DB Listmonk đặt trong **`.env.production`**; docker-compose
truyền vào container (override `[db] password`):

```bash
# thêm vào .env.production (dùng đúng mật khẩu user "listmonk" ở bước 1)
LISTMONK_db__password="MAT_KHAU_DB_LISTMONK"
```

## 3. Chạy Listmonk lần đầu (tạo super admin)

v6 tạo super admin qua **biến môi trường, chỉ ở lần chạy đầu tiên**:

```bash
LISTMONK_ADMIN_USER=admin LISTMONK_ADMIN_PASSWORD='DAT_MAT_KHAU_ADMIN_MANH' \
  docker compose up -d listmonk
docker compose logs -f listmonk    # chờ "HTTP server started on 0.0.0.0:9000"
```
Service tự `--install --idempotent` (tạo schema) rồi chạy. **Các lần sau** chỉ cần
`docker compose up -d listmonk` — Listmonk bỏ qua 2 biến admin khi đã có user.

## 4. Reverse proxy + truy cập Admin

Listmonk chỉ mở `127.0.0.1:9000` (an toàn). Thêm subdomain `mail.dealeg.com` trong Nginx:

```nginx
server {
  server_name mail.dealeg.com;
  location / {
    proxy_pass http://127.0.0.1:9000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
Rồi `certbot --nginx -d mail.dealeg.com`. (Hoặc tạm truy cập qua SSH tunnel:
`ssh -L 9000:127.0.0.1:9000 user@vps` → mở http://localhost:9000.)

Đăng nhập bằng user + mật khẩu admin đã đặt ở bước 3 (`LISTMONK_ADMIN_USER` / `LISTMONK_ADMIN_PASSWORD`).

## 5. Cấu hình SMTP (Brevo) — deliverability

Bản nghiên cứu: **đừng tự chạy mail server**. Dùng Brevo (300 email/ngày free).

1. Đăng ký https://www.brevo.com → **SMTP & API → SMTP**.
2. Trong Listmonk: **Settings → SMTP**, bật và điền:
   - Host: `smtp-relay.brevo.com`  ·  Port: `587`  ·  TLS: `STARTTLS`
   - Username: email Brevo  ·  Password: **SMTP key** của Brevo (không phải mật khẩu login)
   - From: `deals@dealeg.com`
3. **Send test** để kiểm tra.

## 6. SPF / DKIM / DMARC (bắt buộc để vào inbox Gmail/Yahoo)

Thêm DNS record cho `dealeg.com` (Brevo cung cấp giá trị DKIM chính xác):

| Loại | Host | Giá trị |
|---|---|---|
| TXT (SPF) | `@` | `v=spf1 include:spf.brevo.com ~all` |
| TXT (DKIM) | `brevo._domainkey` | *(Brevo cấp — copy từ dashboard)* |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@dealeg.com` |

Xác thực domain trong Brevo (Senders → Domains) trước khi gửi thật.

## 7. Tạo lists double opt-in (mỗi ngôn ngữ)

**Lists → New** cho từng ngôn ngữ ưu tiên (theo research: bắt đầu de, en; sau ja, pt):
- Name: `Deals — English (Weekly)` · Type: **Public** · Opt-in: **Double**
- Lặp lại cho các ngôn ngữ. **Ghi lại List ID** (hiện ở URL/list table).

> Newsletter chỉ phân nhóm **theo ngôn ngữ** (mỗi locale = 1 list). Không dùng list
> theo category/brand.

> Preference center (đổi ngôn ngữ/tần suất/hủy) = trang quản lý subscription tích
> hợp sẵn của Listmonk, link tự chèn trong mỗi email. Không cần build thêm ở dealeg.

Chỉnh **welcome/opt-in email template** (Campaigns → Templates) theo brand dealeg.

## 8. Tạo API user cho dealeg (Admin → Users)

Listmonk v6 dùng RBAC (**User roles** + **List roles**). Tạo user kiểu **API**:

1. **Admin → User roles**: tạo (hoặc dùng) một User role có quyền **`subscribers:manage`**
   và **`lists:manage_all`** (đủ để thêm subscriber vào mọi list). Muốn giới hạn theo
   từng list thì tạo thêm **List role** cấp quyền cho các list ở bước 7.
2. **Admin → Users → New**: đặt **Type = API**, gán User role (± List role) ở bước 1.
3. Lưu → Listmonk hiện **API token MỘT LẦN** (v6 hash token, không xem lại được).
   Copy `username` + `token` ngay.

## 9. Nối vào dealeg (.env.production)

```bash
LISTMONK_URL="https://mail.dealeg.com"
LISTMONK_API_USER="<api username>"
LISTMONK_API_TOKEN="<api token>"
LISTMONK_LIST_MAP='{"en":1,"de":2,"vi":3}'   # locale → List ID ở bước 7
LISTMONK_DEFAULT_LIST_ID="1"
```
Restart dealeg: `docker compose up -d app`.

## 10. Kiểm tra end-to-end

1. Vào dealeg → đăng ký email ở form (hoặc popup exit-intent).
2. Nhận email **xác nhận double opt-in** → bấm xác nhận.
3. Subscriber xuất hiện trong Listmonk với `attribs.locale`, `frequency`, `source`.

---

## Ghi chú

- **Chưa cấu hình env** → dealeg tự fallback lưu vào bảng `Subscriber` (single opt-in
  tạm thời) nên form không bao giờ chết trước khi Listmonk lên.
- Auth API dùng header `Authorization: token <user>:<token>` (chuẩn v6) — đã cài
  sẵn trong `src/lib/listmonk.ts`. BasicAuth (`curl -u user:token`) cũng chấp nhận.
- Compliance EU (Đức/Pháp): **double opt-in bắt buộc** — đã bật ở bước 7; giữ log
  consent (Listmonk tự lưu timestamp + IP xác nhận).
