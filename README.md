# dealeg.com — Boilerplate

Next.js 15 + TypeScript + Tailwind CSS + next-intl — Phase 1 foundation.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| i18n | next-intl v3 |
| Font | Inter (Google Fonts) |
| DB (next step) | PostgreSQL + Prisma |
| Queue (scraping) | BullMQ + Redis |

## Supported languages

| Code | Language | Default |
|---|---|---|
| `vi` | Vietnamese | ✅ |
| `en` | English | |
| `zh-CN` | Chinese (Simplified) | |
| `ja` | Japanese | |
| `de` | German | |
| `es` | Spanish | |
| `fr` | French | |

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your keys
npm run dev
```

Open http://localhost:3000 — auto-redirects to /vi/ via middleware.

## Project structure

```
src/
├── app/
│   ├── layout.tsx               # Root (minimal pass-through)
│   └── [locale]/
│       ├── layout.tsx           # Locale layout + NextIntlClientProvider
│       ├── page.tsx             # Home page
│       └── globals.css          # Tailwind base + custom animations
├── components/
│   ├── layout/
│   │   ├── Header.tsx           # Server component with i18n links
│   │   ├── Footer.tsx           # Server component
│   │   └── LanguageSwitcher.tsx # Client component (useRouter)
│   └── voucher/
│       ├── VoucherCard.tsx      # Client component (copy to clipboard)
│       └── VoucherGrid.tsx      # Server component wrapper
├── i18n/
│   ├── routing.ts               # Locale config (7 locales)
│   ├── request.ts               # Server-side message loader
│   └── navigation.ts            # Type-safe Link, useRouter, usePathname
├── lib/utils.ts                 # cn, formatDate, isExpired, formatCount
├── middleware.ts                # next-intl locale routing
└── types/voucher.ts             # Voucher + VoucherFilters types
messages/
├── vi.json  en.json  zh-CN.json
├── ja.json  de.json  es.json  fr.json
```

## Next steps — Phase 1

- [ ] Add Prisma + PostgreSQL (`npx prisma init`)
- [ ] Replace mock data in `page.tsx` with DB queries
- [ ] Create `/domain`, `/hosting`, `/vpn` category pages
- [ ] Add voucher scraping worker (`src/workers/scraper.ts`) with BullMQ
- [ ] Integrate Namecheap / Hostinger affiliate APIs
- [ ] Add DeepL auto-translation for `description` fields
- [ ] Deploy to Vercel + connect Supabase (free tier)

## Phase 2 additions (months 3-6)

- [ ] `/tools/pdf` — ilovepdf API (`ILOVEPDF_PUBLIC_KEY`)
- [ ] `/tools/office` — OnlyOffice Document Server (Docker)
- [ ] `/tools/image` — Photopea embed (no API needed)
- [ ] `/tools/convert` — CloudConvert API (`CLOUDCONVERT_API_KEY`)
- [ ] User auth with NextAuth.js
- [ ] Email alerts (Resend or Postmark)

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
DATABASE_URL="postgresql://..."
DEEPL_API_KEY=""
NAMECHEAP_AFFILIATE_ID=""
HOSTINGER_AFFILIATE_ID=""
NORDVPN_AFFILIATE_ID=""
ILOVEPDF_PUBLIC_KEY=""
ILOVEPDF_SECRET_KEY=""
CLOUDCONVERT_API_KEY=""
REDIS_URL="redis://localhost:6379"
```

## Notes

- **Root layout**: `app/layout.tsx` is a minimal pass-through; `<html>` and `<body>`
  live in `[locale]/layout.tsx` following the next-intl recommended pattern.
- **Affiliate links**: use `rel="noopener noreferrer sponsored"` — required by Google.
- **hreflang**: auto-generated via `generateMetadata` in locale layout for all 7 locales.
