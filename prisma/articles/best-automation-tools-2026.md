Automation is the rare software category where the tool you pick determines what you can afford to build. Pick wrong and the bill grows faster than the value; pick right and you quietly delete hours of work every week. Three tools dominate — Zapier, Make, and n8n — and they suit genuinely different people. Here's an honest map.

## The three-way split

**Zapier** — the easy one. Biggest app library, simplest model, most expensive.
**Make** — the powerful hosted one. Real branching, far cheaper per unit of work, steeper to learn.
**n8n** — the developer one. Self-hostable, unlimited if you run it yourself, densest interface.

That's the whole landscape. Everything else is detail about which side of those trades you want to be on.

## Zapier: buy it if your time costs more than money

Around 7,000+ integrations is Zapier's moat and it's a real one. If you use a niche CRM, a regional payment provider, or some vertical SaaS nobody's heard of, Zapier probably supports it and the others probably don't. That fact ends a lot of comparisons before they start.

The model is linear: trigger, then actions. A non-technical person builds something useful in ten minutes. Error handling, replays, and history are mature because it's been running business-critical work for over a decade.

**The weakness is price.** Task-based billing escalates fast, multi-step Zaps and the genuinely useful features sit on higher tiers, and mid-size automation routinely lands in the hundreds of dollars a month. Complex conditional logic is a fight rather than a feature.

**Buy Zapier if:** you're non-technical, your automation is simple, or you need an integration only it has.

## Make: the value pick for people willing to learn

Make counts *operations* (each module execution) rather than tasks, and prices them far cheaper — comparable automation typically costs a fraction of Zapier. That's why people migrate.

What you get for the learning curve: routers for real conditional branching, iterators and aggregators for looping over arrays and reassembling results, and a visual canvas where you see the whole flow rather than a vertical list. For anything with "if this then these three things," Make expresses it naturally where Zapier fights you.

**The weakness:** the learning curve is genuinely real. Routers and data mapping require thinking about data structures — exactly what no-code users came to avoid. The app library (~1,500-2,000) has gaps. And the operations meter punishes complexity, so costs are less predictable than Zapier's task count.

**Buy Make if:** your Zapier bill hurts, your workflows need branching, and you'll spend a weekend learning.

## n8n: the developer's answer

n8n is fair-code licensed and self-hostable. Run it on a $6-12/month VPS with Docker and you get **unlimited workflows with unlimited steps** — the meter simply doesn't exist. At serious volume nothing else is close on cost.

Beyond price: your data never leaves your server (often the deciding factor under GDPR, not a nice-to-have), JavaScript and Python nodes are first-class citizens, workflows are JSON you can version in git, and n8n is currently ahead on AI workflows — LLM chains, agents, vector stores.

There's also n8n Cloud, which prices by *execution* (one workflow run, regardless of step count) rather than operation. For complex workflows that's dramatically cheaper than Make while skipping the hosting job.

**The weakness:** self-hosting is a real job — updates, backups, SSL, and watching execution logs fill your disk. The interface is denser. Some integrations are thinner. And fair-code isn't classic open source; read the licence if commercial redistribution matters to you.

**Buy n8n if:** you're comfortable with a VPS, your volume is high, or your data can't leave your infrastructure.

## The honest cost comparison

Model your *actual* workflows, because the answer flips on shape:

- **Few, simple, infrequent** → Zapier's free or cheap tier wins. Don't overthink it.
- **Many, simple, high-volume** → Make is much cheaper; Zapier's task meter punishes you.
- **Complex, multi-step** → n8n Cloud (execution-based) or self-hosted n8n. Make's operation meter punishes exactly the workflows that create the most value.
- **Serious volume, technical team** → self-hosted n8n, and it isn't close.

## What nobody tells you

The tool matters less than the discipline. The most common failure isn't picking wrong — it's building fourteen clever automations that each save two minutes a month, and none that address the thing genuinely eating your week.

Automate what's **frequent, boring, and rule-based**. If it needs judgement, don't automate it. If it happens twice a year, don't automate it. Track the hours you actually save for a month; you'll be surprised which direction the surprise goes.

## The honest verdict

**Start with Zapier's free tier** to learn whether automation helps you at all. It costs nothing and answers the real question.

**Move to Make** when the bill stings and your scenarios have grown branches.

**Move to n8n** when volume, complexity, privacy, or cost make hosted tools irrational — and you have someone who'll own the server.

All three discount annual billing meaningfully, and automation is one of the few subscriptions people genuinely keep for years. Check for a current promotion before you commit to a year of any of them.
