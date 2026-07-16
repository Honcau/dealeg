n8n and Make are the two serious answers for people who've outgrown Zapier's pricing and want real control. They look similar — both are visual, node-based, and far cheaper at volume than Zapier — but they're built on opposite philosophies, and that shows up in your bill, your ceiling, and how much of your evening you spend on this.

## The core difference in one line

**n8n is software you can run.** **Make is a service you rent.**

n8n is open-source-ish (fair-code licensed), self-hostable on any VPS, and priced by *workflow executions* on its cloud tier. Make is fully hosted, priced by *operations* — every individual step in a scenario counts.

That billing distinction is the whole story, so let's do it properly.

## The pricing model matters more than the price

**Make counts operations.** A scenario with 10 steps, run 1,000 times, consumes ~10,000 operations. Complex scenarios burn quota fast. This is why Make looks cheap on the pricing page and gets expensive in production — the meter runs on complexity, not just frequency.

**n8n cloud counts executions.** One workflow run = one execution, regardless of whether it has 3 nodes or 40. Complexity is free; frequency costs. For elaborate workflows this is dramatically cheaper.

**Self-hosted n8n counts nothing.** You pay for a VPS — say $6-12/month — and run unlimited workflows with unlimited steps. If your automation volume is serious, this is the cheapest option in the category by a wide margin, and it isn't close.

The honest implication: if your workflows are simple and infrequent, Make is fine and cheaper to start. If they're complex or high-volume, n8n wins on cost, and self-hosted n8n wins overwhelmingly.

## Where Make is better

**Polish.** The scenario editor is genuinely lovely — clearer visual flow, better error messages, smoother onboarding. It's the more pleasant tool to use on day one.

**App library.** Around 1,500+ integrations, and the popular ones are deeply implemented with the specific triggers and actions you want, not just a generic API call.

**No infrastructure.** Nothing to host, patch, back up, or fix at midnight. For a business without a technical person, this is worth real money.

**Support.** A company with an obligation to answer you, on a plan you pay for.

## Where n8n is better

**Cost at scale.** Covered above. It's not a close contest.

**Control and privacy.** Self-hosted means your data never leaves your server. For anyone handling customer records under GDPR or in a regulated space, this is often the deciding factor, not a nice-to-have.

**Code when you need it.** Drop a JavaScript or Python node in anywhere. Make has functions and some scripting, but n8n treats code as a first-class citizen. If you can program, you'll hit fewer walls.

**AI workflows.** n8n has leaned hard into LLM chains, agents, and vector stores, and it's currently ahead for building AI-flavoured automation.

**No lock-in.** Workflows are JSON. Export them, version them in git, move them to another server.

## Where each genuinely hurts

**Make:** operation-based billing punishes exactly the complex workflows that create the most value; you're on their infrastructure with their data policies; and costs become unpredictable as scenarios grow.

**n8n:** self-hosting is a real job (updates, backups, an SSL certificate, watching the disk fill with execution logs); the interface is denser and less forgiving; the app library is smaller and some integrations are thinner; and the fair-code licence is not classic open source — commercial redistribution has restrictions worth reading if that matters to you.

## The decision, simplified

**Choose Make if** you're not technical, you want it working today, your scenarios are moderate in complexity, and you'd rather pay than administer a server. It's the right answer for most small businesses.

**Choose n8n cloud if** you like n8n's model and want the execution-based pricing without the hosting job. It's the sensible middle.

**Choose self-hosted n8n if** you're comfortable with a VPS and Docker, your volume is high, your workflows are complex, or your data can't leave your infrastructure. The cost difference at scale is enormous — this is the pick for developers.

## The honest verdict

There's no wrong answer here, only a mismatch. The failure mode is picking Make because it's friendlier and then watching operation costs balloon as your scenarios mature — or picking self-hosted n8n because it's cheap and then discovering that you, personally, are now the on-call engineer for your marketing automation.

Price your *actual* workflows against both meters before committing. And check for a current promotion on annual billing either way — both discount meaningfully for paying yearly, and automation is one of the few subscriptions people genuinely keep.
