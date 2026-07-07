Cloudflare sits between your site and its visitors, and its free tier delivers things you'd otherwise pay for or build yourself: a global CDN, DDoS protection, free SSL, and DNS that actually loads fast. For any site on a VPS, putting Cloudflare in front is close to a no-brainer. But a few settings genuinely matter, and one common misconfiguration causes the redirect loops people spend hours debugging. Here's the setup that works.

## What you get for free

The free plan includes a content delivery network caching your static assets at locations worldwide (visitors load from a nearby city, not your single server), automatic mitigation of denial-of-service attacks, free SSL, and among the fastest DNS anywhere. For a solo developer this is a serious amount of infrastructure at no cost.

## Step 1 — Point your domain at Cloudflare

Add your site to Cloudflare, and it scans your existing DNS records. Then update your domain's nameservers (at your registrar) to the two Cloudflare gives you. Propagation takes anywhere from minutes to a few hours. Once active, all traffic flows through Cloudflare.

## Step 2 — Set SSL mode correctly (the important one)

Under SSL/TLS, the mode determines how Cloudflare talks to your server, and the wrong choice breaks things:

- **Flexible** — encrypts visitor-to-Cloudflare but leaves Cloudflare-to-server unencrypted. This is the one to avoid: it causes infamous redirect loops and gives a false sense of security.
- **Full (strict)** — encrypted end to end, with Cloudflare validating your server's certificate. This is what you want.

Since you need a certificate on your server anyway, use Cloudflare's free **Origin Certificate** (a 15-year cert for exactly this purpose) and set the mode to Full (strict). Traffic is now genuinely encrypted the whole way.

## Step 3 — Caching that respects your rules

By default Cloudflare caches static files but not HTML. If you set cache headers on your server (as you should), tell Cloudflare to honor them: under Caching → Configuration, set Browser Cache TTL to **Respect Existing Headers**. Otherwise Cloudflare overrides your carefully chosen cache times with its own default — a subtle source of "why won't my updates show up" confusion.

Enable **Brotli** compression here too (better than gzip, one toggle), and remember to **purge the cache** after each deploy so visitors get the new version.

## Step 4 — The proxy toggle

Each DNS record has an orange-cloud toggle. Orange (proxied) routes traffic through Cloudflare with all its benefits and hides your server's real IP — good for most records. Grey (DNS only) bypasses Cloudflare, which you need for things like mail servers or when directly debugging your origin. Knowing this toggle exists saves confusion when a record behaves unexpectedly.

## A couple of caveats

Cloudflare's free tier is generous but caches aggressively once configured, so during active development you may want to temporarily enable Development Mode (bypasses cache for a few hours). And while DDoS protection is real, it's not infinite on the free plan — genuinely large attacks may need a paid tier. For the vast majority of sites, though, free Cloudflare in front of a cheap VPS is a combination that's hard to beat on price or performance.
