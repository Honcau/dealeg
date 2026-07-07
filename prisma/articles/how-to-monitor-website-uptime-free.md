Finding out your site is down from an angry customer is the worst way to find out. Uptime monitoring watches your site around the clock and alerts you the moment it goes down — and the essential version costs nothing. This guide covers setting up free monitoring that actually reaches you, plus the self-hosted option for developers who want to own it. Either way, you'll know about problems before your users do.

## What uptime monitoring does

A monitor checks your site at regular intervals from outside your infrastructure. When a check fails, it alerts you — email, push, Slack, wherever you'll see it. That external vantage point matters: your server can't tell you it's down if it's the thing that's down. The whole point is an independent watcher.

## The free hosted route

Several services offer genuinely useful free tiers: checks every few minutes, alerts to email or an app, and a public status page. For most sites this is all you need, and the free tier is often permanent rather than a trial. Sign up, enter your URL, set where alerts go, and you're covered in two minutes.

What to configure regardless of provider: a check interval of one to five minutes (frequent enough to catch problems fast), alerts to a channel you'll actually notice at 3 a.m. (push notifications beat email for urgency), and if offered, checking from multiple locations so one flaky network path doesn't cry wolf.

## The self-hosted route: Uptime Kuma

Developers who prefer to own their monitoring can self-host **Uptime Kuma**, an excellent open-source monitor, on a VPS. The irony to plan around: don't run it on the *same* server it's monitoring, or they'll fail together and no alert will fire. A separate cheap VPS, or a different provider entirely, keeps the watcher independent.

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    ports:
      - "127.0.0.1:3001:3001"
    volumes:
      - kuma_data:/app/data
volumes:
  kuma_data:
```

Proxy it through Nginx with SSL (see our Cloudflare and SSL guides), and you get a self-owned monitoring dashboard with alerts to dozens of services — Telegram, Discord, Slack, email, and more.

## Monitor the right things

Beyond "is the homepage up," a few checks catch problems a basic ping misses. Monitor a **health-check endpoint** that actually touches your database, so you catch a dead database even when the web server responds. Watch **SSL certificate expiry** — a good monitor warns you weeks before a certificate lapses, preventing the self-inflicted outage of a forgotten renewal (though with auto-renewing Let's Encrypt this should never happen — see our SSL guide). And consider **keyword monitoring**, which flags a page that returns HTTP 200 but shows an error, catching failures a status-code check alone would miss.

## Set up a status page

Most monitors, hosted or self-hosted, can publish a public status page. It's worth doing: during an incident, a status page reduces support load ("yes, we know, here's the live status") and signals professionalism. It turns your monitoring into something your users benefit from too.

## The honest scope

Uptime monitoring tells you *that* something's down, not always *why* — for that you need logs and deeper observability, which is a bigger topic. But knowing immediately when your site fails is the high-value first layer, and it's free. Set it up before you think you need it; the one time it saves you from hours of silent downtime pays for the two minutes forever. Pair it with automated backups (see our backup guide) and you've covered the two things that turn disasters into inconveniences.
