Every app eventually needs to send email — password resets, receipts, notifications, verification links. And every developer eventually learns the hard way that sending it yourself from a VPS lands those emails in spam or nowhere at all. Transactional email services solve deliverability, but the landscape has real differences in price and approach. This guide covers why you need one, how to choose, and how to make sure your email actually arrives.

## Why not just send from your server?

Sending email directly from a VPS technically works and reliably fails to deliver. Mail providers deeply distrust unknown server IPs — yours has no sending reputation, is likely on shared-IP blocklists, and lacks the authentication infrastructure inboxes now demand. Your carefully coded password-reset email silently lands in spam or is dropped outright. Deliverability is a specialized problem, and transactional email services exist because they've solved it: established sending reputation, proper authentication, and the relationships with inbox providers that get mail delivered.

## What these services actually do

A transactional email service sends your app's email through their reputable infrastructure via an API or SMTP. You get deliverability (their IPs are trusted and warmed), authentication handled (the SPF, DKIM, and DMARC records inboxes check), analytics on opens and bounces, and the scale to send reliably. You're renting deliverability you can't easily build yourself.

## Choosing a provider

The main services differ in ways worth matching to your needs. Consider **free-tier generosity** — several send a few thousand emails a month free, plenty for a small app. Weigh **developer experience**, since a clean API and good docs save real time. Note the **pricing model** — some bill per email, others by monthly volume, which suits different sending patterns. And check for **built-in templates** if you'd rather not hand-code HTML email (which is genuinely painful). Popular choices like Resend, SendGrid, Postmark, and others each lean toward different strengths — developer-friendliness, raw scale, or deliverability focus — so match to what your project weights most, and watch for signup deals that sweeten the first months.

## The setup that ensures delivery

Whichever you pick, three DNS records are what make email land in inboxes rather than spam, and skipping them undermines the whole point:

- **SPF** authorizes the service to send on your domain's behalf.
- **DKIM** cryptographically signs your emails so inboxes verify authenticity.
- **DMARC** tells inboxes what to do with mail failing the above, and improves your standing.

The provider gives you the exact records to add at your DNS host. Set all three — modern inbox providers increasingly *require* proper authentication, and mail without it is treated as suspect regardless of how good your service is.

## Keep transactional and marketing separate

One practical distinction: transactional email (triggered by user actions — receipts, resets) and marketing email (newsletters, promotions) are best kept apart, sometimes on separate sending domains or subdomains. Mixing them risks a marketing spam complaint dragging down deliverability of critical transactional mail like password resets. Keeping them separate protects the email your app genuinely can't afford to have fail.

## The realistic path

For most apps: pick a service with a free tier covering your early volume, set up the three authentication records properly, and use their API or SMTP from your app. Deliverability becomes a solved problem you rarely think about, and it costs nothing until you're sending enough that paying is easy to justify. The alternative — fighting spam filters from your own server — is a time sink with no happy ending. This is the rare case where the right tool is non-negotiable; just choose the one whose free tier and approach fit your project, and check for launch offers when you sign up.
