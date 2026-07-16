/**
 * SEED ARTICLES — bài viết gốc về domain, hosting, VPS, VPN + how-to guides
 * Chạy: npm run seed:articles
 *
 * Tất cả tạo ở status DRAFT + locale 'en'.
 * Sau seed: /admin/articles → review → "Dịch tất cả ngôn ngữ" → publish
 */
import { PrismaClient } from '@prisma/client';
import * as fs   from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const ARTICLES = [
  // ── Comparison / "best of" ───────────────────────────────────────────────────
  {
    slug:     'best-domain-registrars-2026',
    category: 'domain',
    file:     'domain-registrars.md',
    title:    'Best Domain Registrars in 2026: A Complete Comparison',
    excerpt:  'Compare eight domain registrars on what actually matters — five-year renewal cost, free WHOIS privacy, transfer friendliness, and developer features.',
  },
  {
    slug:     'best-web-hosting-2026',
    category: 'hosting',
    file:     'web-hosting.md',
    title:    'Best Web Hosting in 2026: Shared, VPS, and Cloud Compared',
    excerpt:  'Understand the three types of hosting, then compare eight providers to match one to your project — with the renewal-price traps explained.',
  },
  {
    slug:     'best-vps-providers-2026',
    category: 'vps',
    file:     'vps-providers.md',
    title:    'Best Cheap VPS Providers in 2026: Ranked by Workload',
    excerpt:  'A developer-focused comparison of eight VPS providers across price, performance, and global reach — with guidance on when you actually need a VPS.',
  },
  {
    slug:     'best-vpn-2026',
    category: 'vpn',
    file:     'best-vpn-2026.md',
    title:    'Best VPN in 2026: Speed, Privacy, and Price Compared',
    excerpt:  'Compare the leading VPN providers on audited no-logs, jurisdiction, speed, and honest pricing — and learn how to avoid overpaying at renewal.',
  },

  // ── How-to guides ────────────────────────────────────────────────────────────
  {
    slug:     'how-to-point-domain-to-hosting',
    category: 'domain',
    file:     'how-to-point-domain.md',
    title:    'How to Point Your Domain to Your Hosting (Step by Step)',
    excerpt:  'Connecting a domain to hosting trips up nearly every beginner. This guide covers both methods, how to verify it worked, and the mistakes that cause errors.',
  },
  {
    slug:     'how-to-choose-web-hosting',
    category: 'hosting',
    file:     'how-to-choose-hosting.md',
    title:    'How to Choose Web Hosting: A Decision Framework',
    excerpt:  'Stop asking "which host is best?" and start asking "what does my project need?" A clear decision tree to match shared, VPS, or cloud to your site.',
  },
  {
    slug:     'how-to-build-your-first-website',
    category: 'hosting',
    file:     'how-to-build-first-website.md',
    title:    'How to Build Your First Website in 2026: Two Paths',
    excerpt:  'A complete walkthrough of both routes — traditional WordPress hosting and AI website builders — so you can pick the one that fits your skills and goals.',
  },
  {
    slug:     'how-to-save-money-on-tech',
    category: 'deals',
    file:     'how-to-save-on-tech.md',
    title:    'How to Save Money on Tech Subscriptions: 6 Strategies',
    excerpt:  'Domains, hosting, VPNs, and software quietly drain money through predictable tricks. Six deliberate habits to cut your annual tech spending without sacrifice.',
  },
  {
    slug:     'best-ai-website-builders-2026',
    category: 'website-builder',
    file:     'best-ai-website-builders-2026.md',
    title:    'Best AI Website Builders in 2026: Compared by Use Case',
    excerpt:  'AI website builders have split into three lanes — business, design, and code-first. Compare Wix, Hostinger, Framer, Webflow, and more, with the hidden costs exposed.',
  },
  {
    slug:     'best-ai-coding-tools-2026',
    category: 'coding-tools',
    file:     'best-ai-coding-tools-2026.md',
    title:    'Best AI Coding Tools in 2026: Copilot, Cursor, Claude Code',
    excerpt:  'A developer comparison across three paradigms — inline assistants, terminal agents, and AI IDEs. Honest pricing, and why the best developers combine several.',
  },

  // ── Batch 2: High-commission provider targeting ──────────────────────────────
  {
    slug:     'best-managed-wordpress-hosting-2026',
    category: 'hosting',
    file:     'best-managed-wordpress-hosting-2026.md',
    title:    'Best Managed WordPress Hosting in 2026: Kinsta, Cloudways, WP Engine',
    excerpt:  'Compare the leading managed WordPress hosts on speed, support, and price — from premium Kinsta to value-focused Cloudways — and decide if the premium is worth it.',
  },
  {
    slug:     'nordvpn-vs-surfshark-vs-expressvpn-2026',
    category: 'vpn',
    file:     'nordvpn-vs-surfshark-vs-expressvpn-2026.md',
    title:    'NordVPN vs Surfshark vs ExpressVPN (2026): Which Should You Pick?',
    excerpt:  'A head-to-head comparison of the three most recommended VPNs on speed, price, device limits, and features — so you pick the right one without overpaying.',
  },
  {
    slug:     'best-wordpress-hosting-beginners-2026',
    category: 'hosting',
    file:     'best-wordpress-hosting-beginners-2026.md',
    title:    'Best WordPress Hosting for Beginners in 2026',
    excerpt:  'The most beginner-friendly WordPress hosts compared — Bluehost, Hostinger, DreamHost, SiteGround — with the upsell traps and renewal tricks to avoid.',
  },
  {
    slug:     'cloudways-vs-kinsta-2026',
    category: 'hosting',
    file:     'cloudways-vs-kinsta-2026.md',
    title:    'Cloudways vs Kinsta (2026): Managed WordPress Compared',
    excerpt:  'Two top managed WordPress hosts, two very different approaches. Compare price, performance, and support to choose between premium simplicity and flexible value.',
  },
  {
    slug:     'best-wordpress-page-builders-2026',
    category: 'website-builder',
    file:     'best-wordpress-page-builders-2026.md',
    title:    'Best WordPress Page Builders in 2026: Elementor, Divi, Bricks',
    excerpt:  'Compare the top WordPress page builders on features, performance impact, and price — and learn how to build professional pages without slowing your site.',
  },
  {
    slug:     'best-password-managers-2026',
    category: 'security',
    file:     'best-password-managers-2026.md',
    title:    'Best Password Managers in 2026: Dashlane, Bitwarden, 1Password',
    excerpt:  'The single most impactful security tool compared — from open-source Bitwarden to polished Dashlane — so you finally use unique strong passwords everywhere.',
  },
  {
    slug:     'best-cloud-hosting-developers-2026',
    category: 'vps',
    file:     'best-cloud-hosting-developers-2026.md',
    title:    'Best Cloud Hosting for Developers in 2026',
    excerpt:  'A developer-focused comparison of DigitalOcean, Vultr, Linode, and Hetzner — plus when a managed layer on top of these clouds makes more sense.',
  },
  {
    slug:     'best-ecommerce-platforms-2026',
    category: 'ecommerce',
    file:     'best-ecommerce-platforms-2026.md',
    title:    'Best eCommerce Platforms in 2026: Shopify, WooCommerce, BigCommerce',
    excerpt:  'Match the right ecommerce platform to your store — hosted simplicity versus open-source control — with the fees and constraints that affect your bottom line.',
  },
  {
    slug:     'best-email-marketing-services-2026',
    category: 'software',
    file:     'best-email-marketing-services-2026.md',
    title:    'Best Email Marketing Services in 2026',
    excerpt:  'The highest-ROI marketing channel, compared. Mailchimp, ConvertKit, Brevo, ActiveCampaign, and MailerLite — matched to creators, stores, and businesses.',
  },
  {
    slug:     'how-to-start-a-blog-2026',
    category: 'hosting',
    file:     'how-to-start-a-blog-2026.md',
    title:    'How to Start a Blog in 2026 (and Make Money)',
    excerpt:  'A complete beginner walkthrough from zero to a live, monetizable blog — platform, hosting, content, audience, and honest ways to earn from it.',
  },

  // ── Batch 3: Online tools (high demand in Vietnam) ───────────────────────────
  {
    slug:     'best-pdf-editors-online-2026',
    category: 'tools',
    file:     'best-pdf-editors-online-2026.md',
    title:    'Best Online PDF Editors in 2026: Free and Paid Compared',
    excerpt:  'Edit, merge, convert, and sign PDFs in your browser. Compare Smallpdf, iLovePDF, Canva, PDF Reader Pro, and PDFelement — with privacy and free-tier limits explained.',
  },
  {
    slug:     'best-online-design-tools-2026',
    category: 'tools',
    file:     'best-online-design-tools-2026.md',
    title:    'Best Online Design Tools in 2026: Canva and Alternatives',
    excerpt:  'Create professional graphics with no design skills. Compare Canva, Adobe Express, Figma, VistaCreate, and Snappa — matched to beginners, marketers, and pros.',
  },
  {
    slug:     'how-to-edit-pdf-online-free-2026',
    category: 'tools',
    file:     'how-to-edit-pdf-online-free-2026.md',
    title:    'How to Edit a PDF Online for Free in 2026 (Step by Step)',
    excerpt:  'Fill forms, sign, annotate, merge, and convert PDFs for free in your browser. A step-by-step guide to every common task, and when free tools are not enough.',
  },

  // ── Developer how-to guides (VPS, deployment, infrastructure) ────────────────
  {
    slug:     'how-to-deploy-nextjs-vps-2026',
    category: 'vps',
    file:     'how-to-deploy-nextjs-vps.md',
    title:    'How to Deploy Next.js on a VPS in 2026 (Docker + Nginx + SSL)',
    excerpt:  'A complete production deployment for Next.js on a cheap VPS — standalone builds, Docker, an Nginx reverse proxy, and free SSL. When it beats Vercel, and the honest maintenance cost.',
  },
  {
    slug:     'how-to-secure-vps-first-10-minutes',
    category: 'vps',
    file:     'how-to-secure-vps-first-10-minutes.md',
    title:    'How to Secure a VPS in the First 10 Minutes',
    excerpt:  'A minute-by-minute hardening checklist for a fresh server — updates, a non-root user, SSH keys, firewall, Fail2ban, and automatic patches. The steps that stop most real-world attacks.',
  },
  {
    slug:     'how-to-free-ssl-lets-encrypt-2026',
    category: 'hosting',
    file:     'how-to-free-ssl-lets-encrypt.md',
    title:    'How to Set Up Free SSL with Let\u2019s Encrypt in 2026',
    excerpt:  'Get a free, auto-renewing HTTPS certificate with Certbot in minutes, including wildcards and the Cloudflare option. Plus the one misconfiguration that causes redirect loops.',
  },
  {
    slug:     'how-to-host-multiple-sites-one-vps',
    category: 'vps',
    file:     'how-to-host-multiple-sites-one-vps.md',
    title:    'How to Host Multiple Websites on One VPS',
    excerpt:  'Run five, ten, or twenty sites on a single cheap VPS with Nginx server blocks — for static sites, WordPress, and Node apps. The setup, the SSL, and the honest capacity limits.',
  },
  {
    slug:     'how-to-deploy-nodejs-pm2',
    category: 'vps',
    file:     'how-to-deploy-nodejs-pm2.md',
    title:    'How to Deploy a Node.js App with PM2 (Keep It Running Forever)',
    excerpt:  'Keep Node apps alive across crashes and reboots, use every CPU core, and deploy with zero downtime using PM2. Plus when to reach for Docker instead.',
  },
  {
    slug:     'how-to-github-actions-deploy-vps',
    category: 'vps',
    file:     'how-to-github-actions-deploy-vps.md',
    title:    'How to Auto-Deploy to a VPS with GitHub Actions',
    excerpt:  'Push to main and have your VPS pull, rebuild, and restart automatically — a simple, secure CI/CD pipeline using GitHub\u2019s free tier and an SSH deploy key.',
  },
  {
    slug:     'how-to-install-docker-ubuntu-2026',
    category: 'vps',
    file:     'how-to-install-docker-ubuntu.md',
    title:    'How to Install Docker on Ubuntu in 2026 (The Right Way)',
    excerpt:  'Install the current Docker engine and Compose v2 from the official repo, run without sudo, and set up log rotation — the steps most tutorials skip that save you later.',
  },
  {
    slug:     'how-to-postgresql-vps-setup',
    category: 'vps',
    file:     'how-to-postgresql-vps-setup.md',
    title:    'How to Set Up PostgreSQL on a VPS (Securely)',
    excerpt:  'Install PostgreSQL, create a proper database and user, and lock it down so bots can\u2019t reach it — plus the backup step that turns your database from a liability into an asset.',
  },
  {
    slug:     'how-to-wireguard-vpn-server',
    category: 'vpn',
    file:     'how-to-wireguard-vpn-server.md',
    title:    'How to Build Your Own VPN with WireGuard on a VPS',
    excerpt:  'Set up a fast, private WireGuard VPN on a VPS in minutes. What a self-hosted VPN does well, what it doesn\u2019t, and when a commercial VPN is the better tool for the job.',
  },
  {
    slug:     'how-to-backup-vps-automatically',
    category: 'vps',
    file:     'how-to-backup-vps-automatically.md',
    title:    'How to Back Up a VPS Automatically (Off-Server)',
    excerpt:  'Set up automated, off-server backups of your database and files with rclone and cron in under an hour — the version that actually saves you, and the restore test everyone skips.',
  },
  {
    slug:     'how-to-ssh-keys-guide',
    category: 'vps',
    file:     'how-to-ssh-keys-guide.md',
    title:    'How to Use SSH Keys (A Practical Guide)',
    excerpt:  'Replace passwords with SSH keys — how they work, generating an Ed25519 key, disabling password login safely, and managing keys across servers. The highest-value security habit.',
  },
  {
    slug:     'how-to-choose-vps-vs-shared-vs-serverless',
    category: 'hosting',
    file:     'how-to-choose-vps-vs-shared-vs-serverless.md',
    title:    'VPS vs Shared Hosting vs Serverless: How to Choose',
    excerpt:  'A decision framework for the three hosting models — what each suits, the cost trap in each, and the natural progression most projects follow. Pick by workload, not hype.',
  },
  {
    slug:     'how-to-cloudflare-developer-setup',
    category: 'hosting',
    file:     'how-to-cloudflare-developer-setup.md',
    title:    'How to Set Up Cloudflare (A Developer\u2019s Guide)',
    excerpt:  'Put Cloudflare\u2019s free CDN, DDoS protection, and SSL in front of your VPS the right way — including the SSL setting that prevents redirect loops and caching that respects your rules.',
  },
  {
    slug:     'how-to-buy-domain-avoid-renewal-traps',
    category: 'domain',
    file:     'how-to-buy-domain-avoid-renewal-traps.md',
    title:    'How to Buy a Domain and Avoid Renewal Traps',
    excerpt:  'The first-year price is marketing; the renewal is what you actually pay. How to buy a domain smartly — the fees to watch, the upsells to skip, and the transfer escape hatch.',
  },
  {
    slug:     'how-to-self-host-n8n-vps',
    category: 'vps',
    file:     'how-to-self-host-n8n-vps.md',
    title:    'How to Self-Host n8n on a VPS (Automation You Own)',
    excerpt:  'Run unlimited automation workflows on a flat-cost VPS with self-hosted n8n and Docker. The secure setup, the backup that matters, and when hosted n8n is the smarter call.',
  },
  {
    slug:     'how-to-monitor-website-uptime-free',
    category: 'hosting',
    file:     'how-to-monitor-website-uptime-free.md',
    title:    'How to Monitor Website Uptime for Free',
    excerpt:  'Know your site is down before your users do. Free hosted monitoring, self-hosted Uptime Kuma, what to actually monitor, and setting up a status page — all at no cost.',
  },
  {
    slug:     'how-to-speed-up-website-dev-checklist-2026',
    category: 'hosting',
    file:     'how-to-speed-up-website-dev-checklist.md',
    title:    'How to Speed Up a Website: A Developer\u2019s Checklist for 2026',
    excerpt:  'A practical, impact-ordered checklist — images, compression, caching, CDN, and lean JavaScript. Fix the big rocks, know when returns diminish, and optimize for real experience over vanity scores.',
  },
  {
    slug:     'how-to-reduce-cloud-costs-side-projects',
    category: 'hosting',
    file:     'how-to-reduce-cloud-costs-side-projects.md',
    title:    'How to Reduce Cloud Costs for Side Projects',
    excerpt:  'A side project shouldn\u2019t cost more than it earns. Why bills balloon, the one-cheap-VPS foundation, stacking free tiers, killing idle resources, and capping runaway per-usage risk.',
  },
  {
    slug:     'how-to-set-up-staging-environment',
    category: 'vps',
    file:     'how-to-set-up-staging-environment.md',
    title:    'How to Set Up a Staging Environment (Without Overcomplicating It)',
    excerpt:  'Test changes safely before they hit production. Three practical approaches from separate VPS to branch previews, keeping staging data sane, and why not to over-engineer it.',
  },
  {
    slug:     'how-to-send-transactional-email-2026',
    category: 'tools',
    file:     'how-to-send-transactional-email.md',
    title:    'How to Send Transactional Email in 2026 (That Actually Arrives)',
    excerpt:  'Why sending email from your own server fails, how to choose a transactional email service, and the three DNS records (SPF, DKIM, DMARC) that get mail into inboxes instead of spam.',
  },
  // ── Provider comparisons (honest, two-sided) ────────────────────────────────
  {
    slug:     'kinsta-vs-wpengine-2026',
    category: 'hosting',
    file:     'kinsta-vs-wpengine-2026.md',
    title:    'Kinsta vs WP Engine 2026: Which Premium WordPress Host Wins?',
    excerpt:  'An honest side-by-side of the two top premium managed WordPress hosts \u2014 dashboard, performance, support, and the weaknesses of each. Which fits bloggers vs agencies.',
  },
  {
    slug:     'digitalocean-vs-vultr-2026',
    category: 'vps',
    file:     'digitalocean-vs-vultr-2026.md',
    title:    'DigitalOcean vs Vultr 2026: Which Cloud VPS Is Better?',
    excerpt:  'Two developer-favorite VPS providers compared honestly \u2014 documentation, locations, price-to-performance, and where each falls short. Which to pick for learning vs specific regions.',
  },
  {
    slug:     'n8n-vs-zapier-2026',
    category: 'software',
    file:     'n8n-vs-zapier-2026.md',
    title:    'n8n vs Zapier 2026: Which Automation Tool Should You Use?',
    excerpt:  'Open-source control vs no-code simplicity. An honest comparison of n8n and Zapier \u2014 app libraries, cost at scale, learning curve, and who each really suits.',
  },
  {
    slug:     'webflow-vs-squarespace-2026',
    category: 'website-builder',
    file:     'webflow-vs-squarespace-2026.md',
    title:    'Webflow vs Squarespace 2026: Design Freedom vs Simplicity',
    excerpt:  'Powerful design control vs launch-fast simplicity. An honest look at Webflow and Squarespace \u2014 learning curve, flexibility, pricing, and which fits designers vs small businesses.',
  },
  {
    slug:     'getresponse-vs-mailchimp-2026',
    category: 'software',
    file:     'getresponse-vs-mailchimp-2026.md',
    title:    'GetResponse vs Mailchimp 2026: Which Email Platform Wins?',
    excerpt:  'All-in-one marketing toolkit vs polished email-first platform. An honest comparison of features, automation, cost as your list grows, and where each falls short.',
  },
  // ── Provider-focused how-to guides ──────────────────────────────────────────
  {
    slug:     'how-to-migrate-wordpress-to-kinsta',
    category: 'hosting',
    file:     'how-to-migrate-wordpress-to-kinsta.md',
    title:    'How to Migrate a WordPress Site to Kinsta (Step by Step)',
    excerpt:  'Moving to premium managed hosting is smoother than you think. A step-by-step migration guide \u2014 backup, free migration service, staging tests, DNS switch \u2014 and what to watch for.',
  },
  {
    slug:     'how-to-launch-wordpress-cloudways',
    category: 'hosting',
    file:     'how-to-launch-wordpress-cloudways.md',
    title:    'How to Launch a WordPress Site on Cloudways',
    excerpt:  'Cloud power without server admin. A step-by-step guide to launching WordPress on Cloudways \u2014 choosing a server, SSL, caching, backups \u2014 and who this middle path suits.',
  },
  {
    slug:     'how-to-build-first-automation-make',
    category: 'software',
    file:     'how-to-build-first-automation-make.md',
    title:    'How to Build Your First Automation with Make (No Code)',
    excerpt:  'Automate repetitive tasks without code. A beginner walkthrough of building your first Make scenario \u2014 triggers, actions, testing \u2014 plus the mindset that makes automation useful.',
  },
  {
    slug:     'how-to-set-up-vpn-all-devices',
    category: 'vpn',
    file:     'how-to-set-up-vpn-all-devices.md',
    title:    'How to Set Up a VPN on All Your Devices',
    excerpt:  'Protect your phone, computer, and more with a commercial VPN. A step-by-step setup guide, what a VPN can and cannot do, and how to choose between the good options.',
  },
  {
    slug:     'how-to-start-email-newsletter',
    category: 'software',
    file:     'how-to-start-email-newsletter.md',
    title:    'How to Start an Email Newsletter from Scratch',
    excerpt:  'Build the one marketing asset you actually own. A step-by-step guide \u2014 choosing a tool, signup forms, welcome emails, sustainable sending \u2014 and what actually grows a list.',
  },

  // \u2500\u2500 Batch 4: Stage 2 \u2014 recurring-commission clusters \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Kinsta (hosting), PureVPN/Ivacy (VPN), Webflow (builder), n8n/Make
  // (automation), GetResponse/AWeber (email). Each brand gets a bottom-funnel
  // review + comparisons + a cluster hub/how-to.

  // Kinsta
  {
    slug:     'kinsta-review-2026',
    category: 'hosting',
    file:     'kinsta-review-2026.md',
    title:    'Kinsta Review 2026: Is Premium Managed WordPress Worth It?',
    excerpt:  'An honest review of the premium managed WordPress host \u2014 the Google Cloud platform, the best dashboard in the category, and the three real weaknesses: price, metered overages, and no email.',
  },
  {
    slug:     'kinsta-vs-siteground-2026',
    category: 'hosting',
    file:     'kinsta-vs-siteground-2026.md',
    title:    'Kinsta vs SiteGround 2026: Premium vs Mainstream WordPress Hosting',
    excerpt:  'These two aren\u2019t competing for the same customer. Compare the real price gap, renewal traps, performance headroom, and email \u2014 and find which tier your site is actually at.',
  },
  {
    slug:     'kinsta-pricing-explained-2026',
    category: 'hosting',
    file:     'kinsta-pricing-explained-2026.md',
    title:    'Kinsta Pricing Explained (2026): What You Actually Pay',
    excerpt:  'Kinsta\u2019s pricing is transparent but structured oddly. The visit and storage meters, the overage rates, the email cost nobody mentions, and three legitimate ways to cut the bill.',
  },

  // PureVPN / Ivacy
  {
    slug:     'purevpn-review-2026',
    category: 'vpn',
    file:     'purevpn-review-2026.md',
    title:    'PureVPN Review 2026: Cheap, Audited, and Carrying a Past',
    excerpt:  'The full picture including the 2017 logging incident and the audits since. Where PureVPN is genuinely good value, where it falls short, and whose threat model it does not suit.',
  },
  {
    slug:     'ivacy-review-2026',
    category: 'vpn',
    file:     'ivacy-review-2026.md',
    title:    'Ivacy VPN Review 2026: Cheap, but Who Is It For?',
    excerpt:  'An honest look at one of the cheapest credible VPNs \u2014 including the corporate connection to PureVPN that most reviews leave out, and what the low price actually costs you.',
  },
  {
    slug:     'purevpn-vs-ivacy-2026',
    category: 'vpn',
    file:     'purevpn-vs-ivacy-2026.md',
    title:    'PureVPN vs Ivacy 2026: Two Budget VPNs, One Family',
    excerpt:  'These two brands are widely reported to share corporate roots \u2014 which changes the comparison entirely. What actually differs, what they share, and whether either is the right buy.',
  },
  {
    slug:     'best-budget-vpn-2026',
    category: 'vpn',
    file:     'best-budget-vpn-2026.md',
    title:    'Best Budget VPNs in 2026: Cheap Without Being Nasty',
    excerpt:  'A budget VPN isn\u2019t a bad VPN \u2014 but the tier contains genuinely bad options. Surfshark, PureVPN, Ivacy, and Mullvad compared, with the renewal trap that costs more than the VPN.',
  },
  {
    slug:     'vpn-lifetime-deals-explained-2026',
    category: 'vpn',
    file:     'vpn-lifetime-deals-explained-2026.md',
    title:    'Are Lifetime VPN Deals Worth It? The Honest Maths',
    excerpt:  'A $39 one-off payment for a service with recurring costs forever. Why the spreadsheet never works, what actually happens to lifetime buyers, and what to buy instead.',
  },

  // Webflow
  {
    slug:     'webflow-review-2026',
    category: 'website-builder',
    file:     'webflow-review-2026.md',
    title:    'Webflow Review 2026: Design Freedom With a Real Learning Curve',
    excerpt:  'Webflow is a visual front-end tool wearing a website builder\u2019s marketing. Why designers love it, why small business owners bounce off it, and which group you\u2019re in.',
  },
  {
    slug:     'webflow-vs-wordpress-2026',
    category: 'website-builder',
    file:     'webflow-vs-wordpress-2026.md',
    title:    'Webflow vs WordPress 2026: Which Should You Build On?',
    excerpt:  'Not old versus new \u2014 two correct answers to different questions. Flexibility and ownership versus design quality and zero maintenance, plus the hybrid nobody tells you is allowed.',
  },
  {
    slug:     'how-to-build-website-webflow',
    category: 'website-builder',
    file:     'how-to-build-website-webflow.md',
    title:    'How to Build a Website with Webflow (Step by Step)',
    excerpt:  'Most Webflow tutorials skip the one concept that makes it click. Start with the box model, then build structure, responsive layouts, a CMS collection, and publish properly.',
  },
  {
    slug:     'webflow-pricing-explained-2026',
    category: 'website-builder',
    file:     'webflow-pricing-explained-2026.md',
    title:    'Webflow Pricing Explained (2026): Site Plans vs Workspace',
    excerpt:  'Two separate plan types that do different things \u2014 and you often need both. The real CMS ceilings, the staging trap that makes people overpay, and how to cut the bill legitimately.',
  },

  // n8n / Make
  {
    slug:     'n8n-vs-make-2026',
    category: 'software',
    file:     'n8n-vs-make-2026.md',
    title:    'n8n vs Make 2026: Which Automation Platform Fits You?',
    excerpt:  'Software you can run versus a service you rent. Why the billing model \u2014 operations versus executions versus unlimited self-hosted \u2014 matters more than the sticker price.',
  },
  {
    slug:     'make-vs-zapier-2026',
    category: 'software',
    file:     'make-vs-zapier-2026.md',
    title:    'Make vs Zapier 2026: Power vs Polish',
    excerpt:  'Zapier sells simplicity and a 7,000-app library; Make sells real branching for a fraction of the cost. The billing models compared, and the migration effort nobody budgets for.',
  },
  {
    slug:     'best-automation-tools-2026',
    category: 'software',
    file:     'best-automation-tools-2026.md',
    title:    'Best Automation Tools in 2026: Zapier, Make, n8n',
    excerpt:  'The tool you pick decides what automation you can afford to build. An honest map of the three-way split \u2014 easy, powerful, or self-hosted \u2014 matched to who you actually are.',
  },
  {
    slug:     'automation-ideas-that-save-hours',
    category: 'software',
    file:     'automation-ideas-that-save-hours.md',
    title:    '10 Automations Worth Building First',
    excerpt:  'Most people automate the wrong things and conclude automation is overrated. Ten boring, frequent, rule-based workflows that actually return hours \u2014 and the three rules for choosing.',
  },

  // GetResponse / AWeber
  {
    slug:     'getresponse-review-2026',
    category: 'software',
    file:     'getresponse-review-2026.md',
    title:    'GetResponse Review 2026: All-in-One, Honestly Assessed',
    excerpt:  'A solid email platform with the best automation builder in its price class and webinars nobody else bundles \u2014 or a suite of rooms you\u2019ll never use. Which depends entirely on you.',
  },
  {
    slug:     'aweber-review-2026',
    category: 'software',
    file:     'aweber-review-2026.md',
    title:    'AWeber Review 2026: The Veteran Still Worth Considering?',
    excerpt:  'Twenty-plus years of deliverability reputation, phone support at every tier, and an honest free plan \u2014 against automation that stopped competing. Who that trade actually suits.',
  },
  {
    slug:     'aweber-vs-getresponse-2026',
    category: 'software',
    file:     'aweber-vs-getresponse-2026.md',
    title:    'AWeber vs GetResponse 2026: Which Email Platform Wins?',
    excerpt:  'Both launched in 1998 and aged in opposite directions \u2014 one stayed simple, one became a suite. The automation gap is decisive, but not for everyone. Plus the migration angle nobody mentions.',
  },
  {
    slug:     'best-email-autoresponders-2026',
    category: 'software',
    file:     'best-email-autoresponders-2026.md',
    title:    'Best Email Autoresponders in 2026',
    excerpt:  'The least glamorous marketing tool and the one that quietly earns most. GetResponse, AWeber, MailerLite, ConvertKit, ActiveCampaign, and Klaviyo \u2014 compared on what actually matters.',
  },
];

async function main() {
  console.log(`🌱 Seeding ${ARTICLES.length} articles...\n`);

  let created = 0;
  let skipped = 0;

  for (const a of ARTICLES) {
    const filePath = path.join(__dirname, 'articles', a.file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠  File không tồn tại: ${a.file} — bỏ qua`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    const existing = await prisma.article.findUnique({ where: { slug: a.slug } });
    if (existing) {
      console.log(`⏭  Bỏ qua "${a.slug}" — đã tồn tại`);
      skipped++;
      continue;
    }

    await prisma.article.create({
      data: {
        slug:     a.slug,
        status:   'DRAFT',
        category: a.category,
        translations: {
          create: {
            locale:           'en',
            title:            a.title,
            excerpt:          a.excerpt,
            content,
            isAutoTranslated: false,
          },
        },
      },
    });

    created++;
    console.log(`✅ ${a.title}`);
    console.log(`   ${a.slug} · ${a.category} · ${content.split(/\s+/).length} từ\n`);
  }

  console.log(`\n🎉 Xong! ${created} bài mới, ${skipped} bỏ qua.`);
  console.log('→ Vào /admin/articles để review, dịch, và publish.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
