# ─── Dockerfile cho Next.js 15 standalone ───────────────────────────────────────
# Multi-stage build. Alpine cần openssl cho Prisma engine.

# Stage 1: Dependencies
FROM node:20-alpine AS deps
# libc6-compat + openssl (Prisma cần) + build tools cho native modules
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
# openssl BẮT BUỘC cho Prisma generate + build
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma generate với binary target cho Alpine (linux-musl-openssl).
# Pin @5.22.0: nếu npx không thấy prisma local sẽ KHÔNG tự tải Prisma 7
# (v7 bỏ cú pháp `url = env(...)` trong schema → lỗi P1012 lúc build).
RUN npx prisma@5.22.0 generate

# NEXT_PUBLIC_* phải có mặt LÚC BUILD (được nhúng vào bundle JS).
# Nhận từ build arg → set thành ENV để `npm run build` thấy được.
ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

# Umami analytics (self-hosted) — script + website id nhúng client-side.
ARG NEXT_PUBLIC_UMAMI_SRC
ENV NEXT_PUBLIC_UMAMI_SRC=$NEXT_PUBLIC_UMAMI_SRC
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner (production)
FROM node:20-alpine AS runner
# openssl BẮT BUỘC cho Prisma engine lúc runtime (migrate + query)
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
