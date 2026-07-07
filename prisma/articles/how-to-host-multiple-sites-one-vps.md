One of the best-kept economics of self-hosting: a single $7 VPS comfortably runs five, ten, even twenty low-to-medium-traffic websites. Agencies quietly do this with client sites; indie hackers run entire product portfolios this way. The mechanism is Nginx server blocks (virtual hosts) — one server, many domains — plus a little discipline about isolation. Here's the full setup and the honest limits.

## How it works

Nginx reads the `Host` header of every incoming request and routes it to the matching site configuration. Each site gets its own config file, document root or app port, and SSL certificate. Nothing about this is exotic — it's how shared hosting worked all along; you're just becoming your own shared host without the markup.

## Static or PHP sites

Create a directory per site and a server block per domain:

```nginx
# /etc/nginx/sites-available/site-a.com
server {
    server_name site-a.com www.site-a.com;
    root /var/www/site-a;
    index index.html;
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/site-a.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Repeat per site. Point each domain's A record at the same server IP — Nginx sorts out the rest.

## Node/Next.js and other apps

Run each app on its own internal port (3000, 3001, 3002...) — ideally each in its own Docker container for dependency isolation — and proxy per domain:

```nginx
server {
    server_name app-b.com;
    location / { proxy_pass http://127.0.0.1:3001; }
}
```

Containers are worth the small overhead here: one app's Node version upgrade can't break another's, and `docker compose down` cleanly removes an entire site.

## SSL for every site

Certbot handles multiple domains on one server without fuss:

```bash
sudo certbot --nginx -d site-a.com -d www.site-a.com
sudo certbot --nginx -d app-b.com
```

Each site gets its own free certificate with auto-renewal.

## The honest limits

**Shared fate.** If the server goes down, every site goes down. Fine for portfolios and side projects; think twice before putting a revenue-critical client site alongside your experiments.

**Noisy neighbors — yours.** One app with a memory leak can starve the rest. Set Docker memory limits (`--memory=512m`) and check `htop` occasionally.

**Capacity math.** A 2 vCPU / 4 GB VPS handles roughly 8–12 typical small sites (static, WordPress, small Node apps). Databases are the RAM hogs — one shared PostgreSQL/MySQL instance with separate databases per site is far more efficient than one per site.

When you outgrow a box, the fix is pleasantly boring: resize the VPS (most providers do this in-place in minutes) or split the heaviest site onto its own server. Per-site cost at ten sites: under a dollar a month — check current VPS coupons and it drops further.
