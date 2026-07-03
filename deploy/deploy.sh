#!/bin/bash
# ─── Deploy script cho Contabo VPS ──────────────────────────────────────────────
# Chạy trên VPS mỗi khi cần update code:
#   cd /home/dealeg && ./deploy/deploy.sh

set -e  # Dừng nếu có lỗi

echo "🚀 Bắt đầu deploy dealeg.com..."

# 1. Pull code mới nhất
echo "📥 Pull code từ GitHub..."
git pull origin main

# 2. Build Docker image
echo "🔨 Build Docker image..."
docker compose build

# 3. Restart container (migration tự chạy khi start)
echo "♻️  Restart app..."
docker compose down
docker compose up -d

# 4. Chờ app khởi động
echo "⏳ Chờ app khởi động..."
sleep 5

# 5. Kiểm tra
if curl -sf http://localhost:3000 > /dev/null; then
  echo "✅ Deploy thành công! App đang chạy."
else
  echo "⚠️  App chưa phản hồi. Xem log: docker compose logs -f app"
fi
