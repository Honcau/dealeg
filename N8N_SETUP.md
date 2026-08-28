# n8n Setup — Tự tạo voucher/article NHÁP (n8n-centric)

Dựng **n8n** (workflow automation) để tự phát hiện deal/nội dung từ nguồn ngoài rồi
tạo **voucher/article NHÁP** trong dealeg cho bạn duyệt. Hướng **n8n-centric**: chỉ
n8n always-on; dùng node RSS/HTTP/HTML/Schedule sẵn có để đọc feed + tự diff trang.
**RSSHub/changedetection chưa dựng** — thêm sau chỉ khi một nguồn cụ thể cần (tiết kiệm RAM).

> Các bước **thủ công trên VPS** (code phía dealeg đã xong: 2 endpoint ingest + service
> n8n trong compose). Làm 1 lần. Kiến trúc giống Umami/Listmonk.

**Tiết kiệm tài nguyên:** service `n8n` bị **profile-gate** — chưa có `N8N_ENCRYPTION_KEY`
thì KHÔNG chạy (0 RAM). Khi chạy: `mem_limit 512m`, `cpus 0.75`, heap 384m, telemetry off,
**SQLite** (không thêm DB). n8n phải always-on để chạy lịch/webhook.

---

## 1. Điền biến vào `.env.production`

```bash
# Khoá mã hoá credential của n8n — CỐ ĐỊNH (đổi là mất credential đã lưu)
N8N_ENCRYPTION_KEY="<dán kết quả: openssl rand -hex 32>"
```

`INTERNAL_API_TOKEN` (đã có sẵn cho bot) sẽ dùng lại để n8n gọi endpoint ingest — không
cần biến mới.

## 2. DNS

Bản ghi **A** `n8n.dealeg.com` → IP VPS (Cloudflare). Proxy bật/tắt đều được.

## 3. Chạy n8n

`deploy/deploy.sh` tự phát hiện `N8N_ENCRYPTION_KEY` → bật `--profile n8n` + export. Chạy
deploy như thường:

```bash
cd /home/dealeg && ./deploy/deploy.sh
```

Hoặc bật riêng lần đầu:

```bash
export N8N_ENCRYPTION_KEY="<khoá đã sinh>"
docker compose --profile n8n up -d n8n
docker compose logs -f n8n     # chờ "Editor is now accessible"
```

## 4. Reverse proxy + SSL

Block `n8n.dealeg.com` đã có trong `deploy/nginx.conf`. Đồng bộ file Nginx live rồi xin cert:

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d n8n.dealeg.com
```

> Nhắc: `deploy/nginx.conf` là **bản mẫu** — block phải nằm trong file Nginx **live**
> (`/etc/nginx/sites-available/dealeg`) thì certbot mới install được (bài học từ Umami).

## 5. Tạo tài khoản owner (NGAY)

Mở `https://n8n.dealeg.com` → n8n cho **người truy cập ĐẦU TIÊN** tạo tài khoản owner.
Vào ngay sau khi có SSL để "chiếm" owner (đừng để lộ URL trước khi tạo).

## 6. Thêm credential gọi dealeg

Trong n8n: **Credentials → New → Header Auth**:
- Name: `dealeg internal`
- Header Name: `Authorization`
- Header Value: `Bearer <INTERNAL_API_TOKEN>`  ← đúng token trong `.env.production`

Workflow sẽ dùng credential này ở node HTTP Request.

## 7. Endpoint ingest (n8n gọi qua mạng compose)

n8n gọi **`http://app:3000`** (tên service compose, KHÔNG phải domain public — Nginx đã
chặn `/api/internal` từ internet). Cả hai tạo **DRAFT** để duyệt ở `/admin`.

**Voucher** — `POST http://app:3000/api/internal/ingest/voucher`
```jsonc
{
  "code": "SUMMER20",          // bắt buộc
  "provider": "Contabo",       // bắt buộc
  "discount": "20%",           // hiển thị, mặc định ""
  "discountValue": 20,         // số, tuỳ chọn
  "category": "VPS",           // DOMAIN|HOSTING|VPS|VPN|SECURITY|EMAIL|CDN|SSL|AITOOL|OTHER (mặc định OTHER)
  "affiliateUrl": "https://...",
  "sourceUrl": "https://...",  // nguồn deal
  "expiresAt": "2026-12-31T00:00:00Z",  // ISO, tuỳ chọn
  "title": "...", "description": "..."  // tạo bản dịch en, tuỳ chọn
}
```
Chống trùng theo `code+provider` → trùng thì trả `{ok:true, skipped:"duplicate"}`.

**Article** — `POST http://app:3000/api/internal/ingest/article`
```jsonc
{
  "title": "Tiêu đề bài",       // bắt buộc (≥3)
  "content": "Nội dung...",     // bắt buộc (≥10)
  "slug": "tieu-de-bai",        // NÊN truyền slug ỔN ĐỊNH (từ id nguồn) để chạy lại không trùng
  "excerpt": "...", "category": "...", "coverImage": "https://...",
  "sourceUrl": "https://..."    // chèn dòng "> Nguồn:" cuối nội dung
}
```
Chống trùng theo `slug`. Không truyền slug → tự sinh unique từ title (nhưng chạy lại sẽ
tạo bản mới → hãy truyền slug ổn định nếu muốn idempotent).

Phản hồi: `201 {ok, created:true, id[, slug]}` hoặc `{ok:true, skipped:"duplicate"}`.

## 8. Workflow mẫu (dựng trong UI)

**Bài viết từ RSS:**
1. **Schedule Trigger** — ví dụ mỗi ngày 1 lần.
2. **RSS Read** — URL feed tin/deal.
3. (tuỳ chọn) **Filter/Limit** — chỉ lấy item mới.
4. **HTTP Request** — Method `POST`, URL `http://app:3000/api/internal/ingest/article`,
   Authentication = *Header Auth* (`dealeg internal`), Body JSON:
   ```
   { "title": "={{$json.title}}",
     "content": "={{$json.content || $json.contentSnippet}}",
     "slug": "={{$json.guid || $json.link}}",   // ổn định → idempotent (n8n tự slugify? KHÔNG — hãy để dealeg tự sinh: bỏ slug nếu guid không phải a-z0-9-)
     "excerpt": "={{$json.contentSnippet}}",
     "sourceUrl": "={{$json.link}}" }
   ```
   > Lưu ý: `slug` phải khớp `^[a-z0-9-]+$`. Nếu `guid/link` không hợp lệ, **bỏ field slug**
   > để dealeg tự sinh từ title (khi đó chống trùng dựa vào title-slug; hoặc thêm node
   > Function chuẩn hoá guid thành slug hợp lệ để giữ idempotent).

**Deal từ trang không có RSS (tự diff bằng n8n, chưa cần changedetection):**
1. **Schedule Trigger**.
2. **HTTP Request** (GET trang) → **HTML Extract** (lấy code/giá).
3. **Crypto** (hash nội dung) so với lần trước lưu trong **workflow static data** → chỉ đi
   tiếp khi đổi.
4. **HTTP Request POST** `.../ingest/voucher` với `code/provider/discount/sourceUrl`.

## 9. Kiểm tra

- Chạy workflow tay (nút **Execute Workflow**) → node HTTP Request trả `201 created` (hoặc
  `skipped:duplicate` khi chạy lại).
- Vào `/admin` (vouchers/articles) → thấy bản NHÁP mới (voucher `isActive=false`, article
  `DRAFT`) → duyệt/sửa/bật.

---

## Vận hành / tài nguyên

- Trần RAM/CPU ở service `n8n` trong `docker-compose.yml` (`mem_limit 512m`, `cpus 0.75`).
  OOM (`docker inspect dealeg-n8n` thấy `OOMKilled:true`) → nâng `mem_limit` 768m + heap 512.
- Tạm dừng khi cần nhẹ VPS: `docker compose --profile n8n stop n8n` (workflow theo lịch
  sẽ không chạy trong lúc dừng). Bật lại: `... start n8n`.
- `docker stats dealeg-n8n --no-stream` xem tài nguyên thực tế.
- **Pin phiên bản** khi ổn: đổi `docker.n8n.io/n8nio/n8n:latest` thành tag cụ thể đang chạy
  (`docker inspect --format '{{.Config.Image}}' dealeg-n8n`).
- Backup: dữ liệu n8n (workflow + credential) nằm trong volume `n8n-data` → gộp vào lịch
  backup Docker volume.

## Khi nào thêm RSSHub / changedetection

- **RSSHub**: chỉ khi cần feed cho site KHÔNG có RSS mà RSSHub hỗ trợ route sẵn. Thêm 1
  service (profile riêng), n8n RSS Read trỏ vào `http://rsshub:1200/...`.
- **changedetection.io**: chỉ khi n8n tự diff (HTTP + Crypto) không đủ (cần diff hiển thị,
  ảnh, JS-render). Thêm service, webhook về n8n.

Cả hai đều dựng theo cùng khuôn (container 127.0.0.1 + profile + cap RAM). Báo khi cần.
