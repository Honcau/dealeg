#!/bin/bash
# ─── Cron script: gọi scraper mỗi 6 giờ ────────────────────────────────────────
# Cài vào crontab của VPS:
#   crontab -e
#   0 */6 * * * /home/dealeg/deploy/cron-scrape.sh >> /var/log/dealeg-scrape.log 2>&1

CRON_SECRET="THAY_BANG_CRON_SECRET_CUA_BAN"
URL="http://localhost:3000/api/cron/scrape"

echo "[$(date)] Bắt đầu scrape..."
curl -s -H "Authorization: Bearer $CRON_SECRET" "$URL"
echo ""
echo "[$(date)] Xong."
