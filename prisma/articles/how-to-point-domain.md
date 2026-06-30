You bought a domain from one company and hosting from another, and now you need to connect them. This is one of the most common tasks for anyone launching a website, and it trips up nearly every beginner the first time. The good news is that it's genuinely simple once you understand what's happening behind the scenes. This guide walks through every method, explains which one to use, and covers the mistakes that cause the dreaded "this site can't be reached" error.

## What's actually happening when you connect a domain

When someone types your domain into a browser, the internet needs to know which server holds your website's files. That translation — from a human-readable name to a server address — is handled by DNS, the internet's address book. Connecting your domain to your hosting means updating that address book to point at the right server. There are two ways to do this, and choosing the right one matters.

The first method changes your **nameservers**, handing full DNS control to your hosting company. The second keeps DNS at your registrar and points individual **records** at your host. For most beginners, the nameserver method is simpler and the one we recommend. The records method gives you more control and is better if you use services like Cloudflare or send email from your domain.

## Method 1: Changing nameservers (recommended for beginners)

This is the cleanest approach when you want your hosting company to manage everything. You're telling your domain registrar, "Don't handle DNS yourself — let my host do it."

First, find your host's nameservers. They look like `ns1.yourhost.com` and `ns2.yourhost.com`, and you'll find them in your hosting welcome email or control panel under a section called "nameservers" or "DNS." Most hosts list two, sometimes four.

Next, log in to your domain registrar — the company you bought the domain from. Find the domain management area and look for "Nameservers" or "DNS settings." You'll usually see an option like "Use custom nameservers." Select it, delete the registrar's default nameservers, and enter your host's nameservers instead. Save the change.

That's it. The only remaining step is patience: nameserver changes take time to spread across the internet, a process called propagation. It's often live within an hour but can take up to 24 to 48 hours. During this window some visitors see the new site and others see the old one — this is normal and resolves itself.

## Method 2: Pointing DNS records (for more control)

Use this method when you want to keep DNS management at your registrar — for example, if you're using Cloudflare for speed and security, or running email on your domain through a separate provider. Instead of handing over all control, you point specific records at your host.

The key record is the **A record**, which maps your domain to your server's IP address. Your host provides this IP — a number like `192.0.2.10` — in your control panel or welcome email. In your registrar's DNS settings, create or edit the A record so the host (often shown as `@`) points to that IP address.

You'll usually also want a **CNAME record** for the `www` version of your domain, pointing `www` to your root domain so both `example.com` and `www.example.com` work. Save both records and wait for propagation, same as the nameserver method.

## How to check if it worked

Don't just refresh your browser repeatedly — browsers cache aggressively and you'll see stale results. Instead, use an online DNS propagation checker, which shows whether your changes have spread to servers around the world. Type in your domain and you'll see a map of locations and what each one currently sees. When most show your new server, you're live.

If you want to check from your own computer, open a terminal and run a DNS lookup on your domain. It will return the IP address your domain currently points to. If it matches your host's IP, the connection is working.

## Common mistakes that break the connection

**Mixing both methods.** The single most common error is changing nameservers *and* editing A records at the registrar. Once you switch nameservers to your host, the registrar's DNS records are ignored entirely — edit records in your host's panel instead. Pick one method and stick with it.

**Forgetting the www version.** If `example.com` works but `www.example.com` doesn't, you're missing the CNAME or A record for `www`. Add it.

**Expecting instant results.** Propagation is not instant. If you've double-checked your settings and they're correct, give it a full 24 hours before assuming something is wrong. Impatience causes people to "fix" correct settings and break them.

**Typos in the IP or nameserver.** A single wrong digit sends visitors nowhere. Copy and paste rather than typing by hand.

## Which method should you choose?

If you're building your first site and want the least friction, change your nameservers and let your host handle DNS. It's the fewest steps and the hardest to get wrong. If you plan to use Cloudflare, run email on your domain, or manage multiple services, keep DNS at your registrar (or move it to Cloudflare) and point records individually for finer control.

Either way, the connection itself is a five-minute task. The waiting is the hard part — so make your changes, verify them with a propagation checker, and resist the urge to keep tweaking while DNS does its work.
