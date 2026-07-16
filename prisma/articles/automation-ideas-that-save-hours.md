Most people's first automation is a clever thing that saves four minutes a month. Their second is a clever thing that saves three minutes a month. Six weeks later they conclude automation is overrated, and they're right — because they automated the wrong things.

Good automation is boring. It targets work that is **frequent, rule-based, and requires no judgement**. Here are ten that clear that bar, roughly in order of how much time they return.

## 1. Save email attachments to cloud storage automatically

**The rule:** invoice arrives → PDF lands in the right Drive folder, named consistently.

This is the highest-value automation for most freelancers and small businesses, and it's almost never the one people build first. Set a trigger on a Gmail label, extract the attachment, rename with a date prefix, drop it in a folder. Your accountant stops chasing you and you stop searching your inbox in February.

## 2. Turn form submissions into everything at once

**The rule:** someone fills the contact form → row in a spreadsheet, notification in Slack, contact in your email tool, task assigned.

One trigger, four actions. This is where visual automation earns its keep — you're not saving one action, you're saving a chain nobody reliably does by hand.

## 3. Post new content everywhere

**The rule:** new blog post published (RSS trigger) → formatted post to your social accounts, entry into a newsletter draft.

Not "AI writes my tweets." Just: the thing you already wrote goes where it should, in a consistent format, without you doing it at 11pm.

## 4. Sync leads into your CRM without typing

**The rule:** new lead from any source → deduplicated, enriched, tagged, added to the right list.

The value here isn't the minutes; it's that manual CRM entry silently doesn't happen, and leads quietly rot. Automation makes the process real.

## 5. Daily digest instead of constant pings

**The rule:** every morning at 8 → one message with yesterday's signups, sales, errors, and support tickets.

This *removes* notifications rather than adding them. Pull from a few APIs, format one message. It's the automation people keep the longest.

## 6. Back up important data on a schedule

**The rule:** weekly → export the sheet, snapshot the database, drop it somewhere off-site.

Boring, unglamorous, and the one that saves you from a genuinely bad week. If you're self-hosting anything, this is not optional.

## 7. Watch for things that should have happened

**The rule:** if no order came in for 4 hours during business hours → alert.

Monitoring for *absence* is where automation beats human attention entirely. Nobody notices silence; a scheduled check does.

## 8. Client onboarding sequence

**The rule:** deal marked won → folder created, contract sent, kickoff email, tasks generated, calendar invite.

Twenty minutes of clicking per client, done identically every time, with nothing forgotten. Agencies get the most from this one.

## 9. Expense and receipt capture

**The rule:** receipt photographed or emailed → parsed, logged to a sheet with amount, vendor, date, category.

Modern automation tools can OCR and extract fields. Combine with idea #1 and your bookkeeping largely happens by itself.

## 10. Enrich and route support tickets

**The rule:** ticket arrives → look up the customer's plan and history → tag by priority → route to the right person.

The lookup-and-tag work is pure rules. The answering stays human, which is the point.

## The three rules that decide what's worth automating

**Frequency beats cleverness.** A dull task done daily is worth more than a brilliant one done quarterly. If it happens twice a year, do it by hand.

**No judgement allowed.** If a human decides something mid-process, don't automate it — automate the steps around the decision and leave the decision alone. Automations that guess produce work rather than removing it.

**Build for failure.** Every automation breaks eventually: an API changes, a field goes missing, a credential expires. Add an error path that tells you, or you'll discover the failure through a customer. Silent broken automation is worse than no automation, because you've stopped checking.

## Which tool for these

All ten are buildable in any of the main tools. Roughly:

- **Zapier** — simplest to start; fine if you're building three or four of these.
- **Make** — better once workflows branch (idea #2, #8, #10 especially), and much cheaper at volume.
- **n8n** — the right call if you're running many of these, need data to stay on your own server, or want to version workflows in git. Self-hosted on a cheap VPS, the marginal cost of automation eleven through fifty is zero.

## The honest closing note

Pick **one** from this list — probably #1 or #5 — and build it this week. Don't build a system. Live with it for a month and see whether it actually removed work.

If it did, build the next. If it didn't, you've learned something real about your workflow for the price of an evening. That beats a subscription to a tool running fourteen automations you no longer remember configuring.

Whichever tool you land on, check for a current promotion — annual billing is meaningfully cheaper across all three, and automation is one of the few subscriptions worth committing to once it's earning its keep.
