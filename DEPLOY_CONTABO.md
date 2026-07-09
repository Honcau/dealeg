# 🚀 Deploy dealeg.com lên Contabo VPS

Hướng dẫn từng bước, dành cho người mới. Dùng Docker cho app, PostgreSQL cài trực tiếp trên VPS.

---

## Tổng quan kiến trúc

```
Internet → Nginx (port 80/443, SSL) → Docker container (Next.js, port 3000)
                                              ↓
                                     PostgreSQL (trên VPS host, port 5432)
```

---

## Bước 1 — Chuẩn bị VPS Contabo

SSH vào VPS:
```bash
ssh root@IP_VPS_CUA_BAN
```

Cập nhật hệ thống:
```bash
apt update && apt upgrade -y
```

---

## Bước 2 — Cài PostgreSQL trực tiếp trên VPS

```bash
# Cài PostgreSQL
apt install -y postgresql postgresql-contrib

# Tạo database và user
sudo -u postgres psql << 'SQL'
CREATE DATABASE dealeg;
CREATE USER dealeg WITH ENCRYPTED PASSWORD 'DAT_MAT_KHAU_MANH_O_DAY';
GRANT ALL PRIVILEGES ON DATABASE dealeg TO dealeg;
ALTER DATABASE dealeg OWNER TO dealeg;
SQL
```

**Quan trọng:** Cho phép Docker container kết nối PostgreSQL trên host.

Sửa file config PostgreSQL:
```bash
# Tìm file postgresql.conf
nano /etc/postgresql/*/main/postgresql.conf
```
Tìm dòng `listen_addresses` và sửa thành:
```
listen_addresses = '*'
```

Sửa file pg_hba.conf để cho phép kết nối từ Docker:
```bash
nano /etc/postgresql/*/main/pg_hba.conf
```
Thêm dòng này vào cuối (dải IP mặc định của Docker):
```
host    dealeg    dealeg    172.16.0.0/12    scram-sha-256
```

Restart PostgreSQL:
```bash
systemctl restart postgresql
```

---

## Bước 3 — Cài Docker

```bash
# Cài Docker
curl -fsSL https://get.docker.com | sh

# Cài Docker Compose plugin
apt install -y docker-compose-plugin

# Kiểm tra
docker --version
docker compose version
```

---

## Bước 4 — Clone code và cấu hình

```bash
# Tạo thư mục và clone
cd /home
git clone https://github.com/Honcau/dealeg.git
cd dealeg

# Tạo file env production
cp .env.production.example .env.production
nano .env.production
```

Điền các giá trị trong `.env.production`:
```bash
# DB — dùng host.docker.internal để container thấy PostgreSQL trên host
DATABASE_URL="postgresql://dealeg:MAT_KHAU@host.docker.internal:5432/dealeg"

NEXTAUTH_URL="https://dealeg.com"
NEXTAUTH_SECRET="..."   # tạo bằng: openssl rand -base64 32
ADMIN_SECRET="..."
CRON_SECRET="..."       # tạo bằng: openssl rand -hex 32

# OAuth (điền nếu dùng)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

DEEPL_API_KEY="...:fx"
```

---

## Bước 5 — Tạo Prisma migration lần đầu

Trước khi build Docker, cần tạo migration từ schema:
```bash
# Cài Node tạm để tạo migration (chỉ làm 1 lần)
apt install -y nodejs npm
npm ci
npx prisma migrate dev --name init
```

Điều này tạo thư mục `prisma/migrations/` chứa SQL. Commit nó lên Git:
```bash
git add prisma/migrations
git commit -m "Add initial migration"
git push
```

---

## Bước 6 — Build và chạy Docker

```bash
# Build image (lần đầu mất 3-5 phút)
docker compose build

# Chạy (migration tự động deploy khi start)
docker compose up -d

# Xem log
docker compose logs -f app
```

App giờ chạy ở `http://IP_VPS:3000`. Test:
```bash
curl http://localhost:3000
```

---

## Bước 7 — Seed dữ liệu ban đầu

```bash
# Vào trong container để seed
docker compose exec app sh

# Trong container:
npx tsx prisma/seed.ts           # voucher mẫu
npx tsx prisma/seed-articles.ts  # bài viết
exit
```

---

## Bước 8 — Cài Nginx + SSL

```bash
# Cài Nginx và Certbot
apt install -y nginx certbot python3-certbot-nginx

# Copy config
cp deploy/nginx.conf /etc/nginx/sites-available/dealeg
ln -s /etc/nginx/sites-available/dealeg /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Lấy SSL certificate (thay email của bạn)
certbot --nginx -d dealeg.com -d www.dealeg.com

# Reload
systemctl reload nginx
```

**Trước đó:** trỏ domain dealeg.com về IP VPS trong DNS (A record).

---

## Cập nhật code sau này

Mỗi khi có code mới trên GitHub:
```bash
cd /home/dealeg
./deploy/deploy.sh
```
Script này tự: pull code → build → restart → migration.

---

## Các lệnh hữu ích

```bash
docker compose logs -f app     # xem log real-time
docker compose restart app     # restart app
docker compose down            # dừng
docker compose up -d           # chạy lại
docker compose exec app sh     # vào trong container

# Backup database
pg_dump -U dealeg dealeg > backup_$(date +%Y%m%d).sql

# Xem PostgreSQL
sudo -u postgres psql dealeg
```

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| Container không kết nối được DB | pg_hba.conf chưa cho phép | Kiểm tra Bước 2, restart postgresql |
| `host.docker.internal` không resolve | Thiếu extra_hosts | Đã có trong docker-compose.yml |
| Build fail: Prisma engine | Mạng chặn binaries.prisma.sh | VPS cần internet đầy đủ |
| 502 Bad Gateway | App chưa chạy | `docker compose logs -f app` |
| SSL fail | DNS chưa trỏ đúng | Đợi DNS propagate, thử lại certbot |

---

## Bảo mật cơ bản (nên làm)

```bash
# Firewall — chỉ mở port cần thiết
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# PostgreSQL KHÔNG mở ra ngoài (chỉ localhost + Docker)
# → đã cấu hình đúng ở Bước 2
```
