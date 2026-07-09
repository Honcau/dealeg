# dealeg.com

Multilingual tech deals & voucher platform. Next.js 15 + PostgreSQL + Prisma, self-hosted on Contabo VPS via Docker.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, standalone output) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| i18n | next-intl (12 languages + RTL) |
| Database | PostgreSQL (on VPS host) |
| ORM | Prisma |
| Auth | NextAuth v5 (Google, Facebook, GitHub, email) |
| Translation | DeepL API |
| Deploy | Docker Compose + Nginx + Certbot |

## Local development

```bash
npm install
cp .env.example .env.local        # fill DATABASE_URL etc.
cp .env.example .env              # Prisma CLI reads .env
npm run db:push
npm run db:seed
npm run seed:articles
npm run dev
```

## Production deploy

See **DEPLOY_CONTABO.md** for full step-by-step VPS setup.

Quick version:
```bash
git clone https://github.com/Honcau/dealeg.git
cd dealeg
cp .env.production.example .env.production   # fill values
npx prisma migrate dev --name init           # first time only
docker compose build
docker compose up -d
```

## Key features

- 12-language support with automatic RTL for Arabic
- Voucher CRUD with category/provider filtering
- SEO-optimized `/coupon/[brand]` pages with JSON-LD + FAQ schema
- Community comments + voting (verify if codes still work)
- Blog with DeepL auto-translation (write in English → 11 languages)
- Admin panel (HMAC cookie auth) for vouchers + articles
- Auto-generated sitemap + robots.txt

## Docs

- `DEPLOY_CONTABO.md` — VPS deployment
- `AUTH_SETUP.md` — OAuth provider setup
- `AFFILIATE_SOURCES.md` — affiliate program signup guide
- `FEATURES.md` — roadmap
