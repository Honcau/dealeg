# 💰 Nguồn Affiliate cho Web Builder & Coding Tools

Hướng dẫn đăng ký affiliate cho 2 mảng mới, cộng với các mảng sẵn có.

---

## Web Builders

| Brand | Affiliate qua | Hoa hồng | Đăng ký |
|---|---|---|---|
| **Wix** | Trực tiếp + Impact | ~$100/đơn (flat) | wix.com/about/affiliates |
| **Squarespace** | Impact.com | $100-200/đơn | squarespace.com/affiliates |
| **Webflow** | Trực tiếp | 50% năm đầu | webflow.com/partners/affiliate |
| **Framer** | Trực tiếp (Rewardful) | 50% năm đầu (recurring) | framer.com/affiliates |
| **Hostinger** | Trực tiếp + Impact | ~60% | hostinger.com/affiliates |
| **10Web** | Trực tiếp + PartnerStack | ~30% recurring | 10web.io/affiliate-program |
| **Elementor** | Trực tiếp | ~50%/đơn | elementor.com/affiliates |

**Mẹo:** Framer và Webflow trả **recurring** — mỗi tháng user còn dùng, bạn còn nhận hoa hồng. Web builder là subscription dài hạn nên đây là dòng tiền đều.

---

## AI Coding Tools

| Brand | Affiliate | Hoa hồng | Ghi chú |
|---|---|---|---|
| **GitHub Copilot** | ❌ Chưa có | — | Microsoft chưa mở |
| **Cursor** | ❌ Chưa có | — | Chưa có program công khai |
| **Claude Code** | ❌ Chưa có | — | — |
| **Tabnine** | Trực tiếp | 20-30% | tabnine.com/partners |
| **Replit** | Trực tiếp | ~20% recurring | replit.com/site/affiliate |
| **JetBrains** | Trực tiếp | ~25%/đơn | jetbrains.com/store/affiliate |
| **Lovable** | PartnerStack | 20-30% | Đang mở rộng |

**Chiến lược:** Mảng coding tools affiliate còn non — nhiều tool hot chưa có program. Bài viết vẫn nhắc Copilot/Cursor để hút traffic, monetize qua tool CÓ affiliate (Tabnine, Replit, JetBrains). Theo dõi Cursor — họ sẽ sớm mở affiliate.

---

## Network tổng hợp (đăng ký 1 lần, nhiều brand)

| Network | Mạnh về |
|---|---|
| **Impact.com** | Wix, Squarespace, Shopify, Hostinger (bạn đang đăng ký) |
| **PartnerStack** | SaaS + coding tools — nên đăng ký tiếp theo |
| **ShareASale** | Web builders, hosting |
| **CJ Affiliate** | Enterprise brands |

---

## Cách thêm vào dealeg.com

1. Sau khi được duyệt, thêm ID vào `.env.production`:
```bash
WIX_AFFILIATE_ID="..."
FRAMER_AFFILIATE_ID="..."
REPLIT_AFFILIATE_ID="..."
```

2. Provider đã có sẵn trong `src/lib/scrapers/providers.ts` (`WEBSITE_BUILDER_PROVIDERS`, `CODING_TOOL_PROVIDERS`) — điền `affiliateId` + `affiliateParam` là xong.

3. Hoặc thêm voucher thủ công qua `/admin/vouchers` với category `OTHER`.

---

## Ưu tiên triển khai

**Tuần 1 — Web builders** (affiliate trưởng thành, hoa hồng cao):
- Framer + Webflow (recurring 50%)
- Wix, Squarespace qua Impact.com

**Tuần 2 — Coding tools:**
- Tabnine, Replit, JetBrains
- Đăng ký PartnerStack
