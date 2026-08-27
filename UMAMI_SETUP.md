# Umami Setup — Analytics riêng tư, cookieless (chạy song song GA)

Dựng **Umami** (self-hosted) cho dealeg: đo traffic **không cookie, không banner**, dữ
liệu nằm trên VPS của mình. Chạy **song song** Google Analytics (không thay GA) — để
đối chiếu số liệu, khi Umami ổn có thể bỏ GA sau.

> Các bước **thủ công trên VPS** (code phía dealeg đã xong). Làm 1 lần.
> Kiến trúc giống Listmonk: container Umami + DB Postgres host riêng + Nginx subdomain.

**Tiết kiệm tài nguyên:** service `umami` bị **profile-gate** — chưa cấu hình thì
KHÔNG chạy (0 RAM). Khi chạy, container bị giới hạn `mem_limit: 512m`, `cpus: 0.75`
(sửa trong `docker-compose.yml` nếu cần). Phần thu thập beacon phải luôn bật nên
không tắt/bật theo nhu cầu được — nhưng đã cắt telemetry (`DISABLE_TELEMETRY=1`) và
trần heap Node để gọn nhất.

---

## 1. Tạo database cho Umami (PostgreSQL trên host)

Umami dùng Postgres sẵn trên VPS (DB riêng, tách khỏi dealeg + listmonk). Umami **tự
chạy migration** tạo bảng lúc khởi động — không cần import schema tay.

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE umami;
CREATE USER umami WITH ENCRYPTED PASSWORD 'DAT_MAT_KHAU_MANH';
GRANT ALL PRIVILEGES ON DATABASE umami TO umami;
ALTER DATABASE umami OWNER TO umami;
SQL
```

Postgres đã cho container kết nối sẵn (Listmonk đang dùng cùng cơ chế — nếu chưa, xem
DEPLOY_CONTABO.md Bước 2: `listen_addresses='*'` + dòng `pg_hba.conf` cho dải Docker
`172.16.0.0/12`). Không cần cấu hình thêm.

## 2. Điền biến vào `.env.production`

```bash
# DB vừa tạo (host.docker.internal = Postgres trên host, nhìn từ trong container)
UMAMI_DATABASE_URL="postgresql://umami:DAT_MAT_KHAU_MANH@host.docker.internal:5432/umami"

# Chuỗi bí mật CỐ ĐỊNH (Umami ký session/JWT bằng nó — đổi là mọi người bị đăng xuất)
UMAMI_APP_SECRET="<dán kết quả: openssl rand -hex 32>"

# Script nhúng vào site. SRC biết trước; WEBSITE_ID để trống, điền ở Bước 6.
NEXT_PUBLIC_UMAMI_SRC="https://analytics.dealeg.com/script.js"
NEXT_PUBLIC_UMAMI_WEBSITE_ID=""
```

Sinh APP_SECRET:
```bash
openssl rand -hex 32
```

## 3. DNS: analytics.dealeg.com → VPS

Thêm bản ghi **A** `analytics.dealeg.com` → IP VPS (Cloudflare). Proxy (đám mây cam)
bật hay tắt đều được; nếu bật, để **Cache Level: Standard** — Umami tự set
cache-control cho `/script.js`, không cần rule riêng.

## 4. Chạy Umami lần đầu (để lấy Website ID)

Cần Umami chạy TRƯỚC để tạo website + lấy ID, rồi mới rebuild app nhúng ID vào. Export
2 biến cho `docker compose` thấy rồi bật service:

```bash
cd /home/dealeg
export UMAMI_DATABASE_URL="postgresql://umami:DAT_MAT_KHAU_MANH@host.docker.internal:5432/umami"
export UMAMI_APP_SECRET="<chuỗi đã sinh ở Bước 2>"
docker compose --profile umami up -d umami
docker compose logs -f umami       # chờ "Ready" / listening on port 3000
```

Umami tự tạo bảng trong DB `umami` ở lần chạy đầu. (Từ lần deploy sau, `deploy/deploy.sh`
tự phát hiện `UMAMI_DATABASE_URL` → tự export + bật profile, không cần làm tay nữa.)

## 5. Reverse proxy + SSL

Block `analytics.dealeg.com` đã có sẵn trong `deploy/nginx.conf` (chỉ HTTP :80). Đồng
bộ file Nginx như các subdomain khác rồi xin cert:

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d analytics.dealeg.com
```

certbot tự thêm `listen 443 ssl` + cert + redirect 80→443 (giống bot.dealeg.com).

## 6. Tạo website trong Umami → lấy Website ID

1. Mở `https://analytics.dealeg.com`, đăng nhập mặc định **`admin` / `umami`**.
2. **Đổi mật khẩu ngay** (Settings → Profile → Change password).
3. Settings → **Websites** → **Add website**: Name `dealeg`, Domain `dealeg.com` → Save.
4. Mở website vừa tạo → **Edit** → copy **Website ID** (dạng UUID
   `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

## 7. Nhúng script vào site (rebuild app)

Điền ID vừa copy vào `.env.production`:

```bash
NEXT_PUBLIC_UMAMI_WEBSITE_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Rồi deploy lại — `deploy.sh` tự export biến Umami, build app kèm script, giữ container
umami chạy:

```bash
cd /home/dealeg && ./deploy/deploy.sh
```

`NEXT_PUBLIC_*` nhúng **lúc build**, nên đổi Website ID về sau phải chạy lại deploy.sh.

## 8. Kiểm tra

- Mở `https://dealeg.com` (tab ẩn danh), DevTools → Network: có request tới
  `analytics.dealeg.com/script.js` (200) và `POST /api/send` khi chuyển trang.
- Dashboard Umami → website `dealeg` thấy **1 visitor realtime**.
- GA vẫn chạy song song (không đổi gì phía GA).

---

## Vận hành / tiết kiệm tài nguyên

- **Trần RAM/CPU** ở service `umami` trong `docker-compose.yml` (`mem_limit: 512m`,
  `cpus: 0.75`). Nếu container bị OOM-kill (`docker inspect dealeg-umami` thấy
  `OOMKilled: true`), nâng `mem_limit` lên `768m` và heap `--max-old-space-size=512`.
- **Tạm dừng** khi cần nhẹ VPS (sẽ MẤT số liệu trong lúc dừng):
  `docker compose --profile umami stop umami`. Bật lại: `... start umami`.
- **Xem tài nguyên thực tế:** `docker stats dealeg-umami --no-stream`.
- **Pin phiên bản** (khuyến nghị khi đã chạy ổn): đổi `postgresql-latest` trong
  `docker-compose.yml` thành tag cụ thể đang chạy — xem bằng
  `docker inspect --format '{{.Config.Image}}' dealeg-umami`.
- **Backup:** DB `umami` nằm trong Postgres host → gộp vào lịch `pg_dump` chung.

## Gỡ lỗi

| Triệu chứng | Nguyên nhân thường gặp |
|---|---|
| Container restart liên tục | Sai `UMAMI_DATABASE_URL`, hoặc Postgres chưa cho dải Docker kết nối (pg_hba). Xem `docker compose logs umami`. |
| Đăng nhập rồi bị đá ra | `UMAMI_APP_SECRET` bị đổi giữa các lần chạy — đặt cố định. |
| Site không gọi `/script.js` | Quên chạy lại `deploy.sh` sau khi điền `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (script nhúng lúc build). |
| `/script.js` bị adblock chặn | Bình thường với vài adblocker; số liệu vẫn đủ dùng cho xu hướng. Có thể đổi tên script (`TRACKER_SCRIPT_NAME`) sau nếu cần. |
