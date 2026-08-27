#!/bin/bash
# ─── Deploy script cho Contabo VPS ──────────────────────────────────────────────
# Chạy trên VPS mỗi khi cần update code:
#   cd /home/dealeg && ./deploy/deploy.sh

set -e  # Dừng nếu có lỗi

echo "🚀 Bắt đầu deploy dealeg.com..."

# 1. Pull code mới nhất
echo "📥 Pull code từ GitHub..."
git pull origin main

# 2. Đồng bộ schema DB production (thêm cột mới TRƯỚC khi chạy code mới)
#    DB production nằm trên host → dùng localhost (không phải host.docker.internal).
#    db push chỉ tự áp dụng thay đổi ADDITIVE; nếu có drop cột (mất dữ liệu) lệnh sẽ
#    dừng deploy để xử lý tay (an toàn). Prisma pin 5.22.0 vì schema dùng url=env().
echo "🗄️  Đồng bộ schema database..."
PROD_DB=$(grep -m1 '^DATABASE_URL=' .env.production | cut -d= -f2- | tr -d '"' | sed 's/host\.docker\.internal/localhost/')
DATABASE_URL="$PROD_DB" npx --yes prisma@5.22.0 db push --skip-generate

# 3. Build Docker image
# Bot chỉ được bật khi .env.production đã có BOT_TOKEN thật (xem TELEGRAM_BOT_SETUP.md).
BOT_PROFILE=""
if grep -qE '^BOT_TOKEN=.*[A-Za-z0-9]' .env.production 2>/dev/null; then
  BOT_PROFILE="--profile bot"
  echo "🤖 Thấy BOT_TOKEN → bật service bot"
fi

# Umami chỉ bật khi .env.production đã có UMAMI_DATABASE_URL (xem UMAMI_SETUP.md).
# Export các biến để docker compose interpolate ${...} thấy được: build-arg
# NEXT_PUBLIC_UMAMI_* (nhúng script) + runtime DATABASE_URL/APP_SECRET của container.
UMAMI_PROFILE=""
if grep -qE '^UMAMI_DATABASE_URL=.*[A-Za-z0-9]' .env.production 2>/dev/null; then
  UMAMI_PROFILE="--profile umami"
  export UMAMI_DATABASE_URL="$(grep -m1 '^UMAMI_DATABASE_URL=' .env.production | cut -d= -f2- | tr -d '"')"
  export UMAMI_APP_SECRET="$(grep -m1 '^UMAMI_APP_SECRET=' .env.production | cut -d= -f2- | tr -d '"')"
  export NEXT_PUBLIC_UMAMI_SRC="$(grep -m1 '^NEXT_PUBLIC_UMAMI_SRC=' .env.production | cut -d= -f2- | tr -d '"')"
  export NEXT_PUBLIC_UMAMI_WEBSITE_ID="$(grep -m1 '^NEXT_PUBLIC_UMAMI_WEBSITE_ID=' .env.production | cut -d= -f2- | tr -d '"')"
  echo "📊 Thấy UMAMI_DATABASE_URL → bật service umami + nhúng script"
fi

echo "🔨 Build Docker image..."
docker compose $BOT_PROFILE $UMAMI_PROFILE build

# 4. Restart container
echo "♻️  Restart app..."
docker compose $BOT_PROFILE $UMAMI_PROFILE down
docker compose $BOT_PROFILE $UMAMI_PROFILE up -d

# 5. Chờ app khởi động
echo "⏳ Chờ app khởi động..."
sleep 5

# 6. Kiểm tra
if curl -sf http://localhost:3000 > /dev/null; then
  echo "✅ Deploy thành công! App đang chạy."
else
  echo "⚠️  App chưa phản hồi. Xem log: docker compose logs -f app"
fi
