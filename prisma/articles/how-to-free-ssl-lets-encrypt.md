Paying for a standard SSL certificate in 2026 is almost always unnecessary. Let's Encrypt has issued billions of free certificates, browsers trust them identically to paid ones, and renewal is fully automatic. The only things paid certificates still offer are organization validation banners nobody reads and warranty amounts nobody claims. Here's how to set up free SSL properly, plus the one scenario where a different approach wins.

## The 3-minute setup with Certbot

On a VPS running Nginx (Apache works the same with the matching plugin):

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot proves you control the domain, obtains the certificate, rewrites your Nginx config for HTTPS, and sets up an automatic redirect from HTTP. Done — your site now has the padlock.

## Auto-renewal (already handled, but verify)

Let's Encrypt certificates last 90 days by design, forcing automation. Certbot installs a systemd timer that renews anything within 30 days of expiry. Verify it works without waiting:

```bash
sudo certbot renew --dry-run
```

If that passes, you will never think about SSL again. Certificate expiry outages — still embarrassingly common on corporate sites — simply cannot happen to you.

## Wildcard certificates

A wildcard (`*.example.com`) covers unlimited subdomains with one certificate, useful for multi-tenant apps or lots of services. Wildcards require a DNS challenge instead of the HTTP one:

```bash
sudo certbot certonly --manual --preferred-challenges dns -d "*.example.com"
```

Certbot asks you to create a TXT record to prove domain control. For automatic wildcard renewal you need a DNS plugin matching your DNS provider (Cloudflare's is the most common) with an API token — a 10-minute one-time setup.

## The Cloudflare alternative

If your domain already routes through Cloudflare's proxy, you get HTTPS between visitors and Cloudflare automatically, with zero server configuration. The critical detail: set SSL mode to **Full (strict)**, which still requires a certificate on your server (Cloudflare issues a free 15-year "origin certificate" for exactly this). The tempting "Flexible" mode leaves traffic between Cloudflare and your server unencrypted and causes infamous redirect loops — avoid it.

Which approach to pick: Certbot alone if you don't use Cloudflare; Cloudflare origin certificate + Full (strict) if you do, since it removes renewal entirely from your server.

## When you'd still pay

Extended Validation and organization-validated certificates matter only for specific compliance requirements, and some enterprises mandate them for internal policy reasons. For every blog, SaaS, store, and API the rest of us run, free is not the budget option — it's the correct one. Spend the savings on better hosting instead; that's a difference visitors actually feel.
