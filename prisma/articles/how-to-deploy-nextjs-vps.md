Vercel is the easiest way to deploy Next.js — until you hit its limits. Serverless function timeouts, bandwidth costs, and per-seat pricing push many developers toward a plain VPS, where $5–7 per month buys predictable performance and zero platform restrictions. This guide walks through a production Next.js deployment on a VPS: Docker, Nginx, and SSL, the same stack running countless production sites.

## When a VPS beats Vercel (and when it doesn't)

A VPS wins on cost at scale (flat monthly price, no bandwidth surprises), long-running processes (no function timeouts), and full control (cron jobs, databases on the same box, any runtime). Vercel wins on zero maintenance, instant global edge, and preview deployments out of the box. If your project is a hobby site with light traffic, Vercel's free tier is genuinely hard to beat. The VPS case starts when you need a database anyway, when bandwidth bills appear, or when you simply want to own your stack.

Budget VPS providers like Hostinger, Contabo, Vultr, and DigitalOcean all handle this fine — 2 vCPU and 4 GB RAM is a comfortable starting point for Next.js and a database (coupon codes for these providers circulate constantly; check current deals before paying list price).

## Step 1 — Prepare the app

Enable standalone output in `next.config.js` so the build bundles only what it needs:

```js
module.exports = { output: 'standalone' };
```

Add a `Dockerfile` (multi-stage, Alpine):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

## Step 2 — Build and run on the server

SSH in, install Docker (see our Docker guide), clone your repo, then:

```bash
docker build -t myapp .
docker run -d --name myapp --restart unless-stopped -p 3000:3000 myapp
```

Your app now serves on port 3000. Never expose 3000 directly to the internet — Nginx goes in front.

## Step 3 — Nginx reverse proxy

```nginx
server {
    server_name example.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site, reload Nginx, and point your domain's A record at the server IP.

## Step 4 — Free SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

Certbot rewrites the Nginx config for HTTPS and auto-renews. Total cost so far: the VPS itself.

## The honest downsides

You are now the ops team. Security updates, disk space, backups, and 3 a.m. outages are yours. Budget an hour a month for maintenance and set up automated backups from day one. If that trade-off sounds wrong for your project, managed hosting remains the saner choice — the point is to choose deliberately, not by default.
