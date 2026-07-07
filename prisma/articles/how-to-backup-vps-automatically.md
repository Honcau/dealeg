The difference between a minor incident and a catastrophe is whether you have backups. A hacked, corrupted, or accidentally-wiped server you can restore is a bad afternoon; one you can't is a closed business. Yet backups are the thing everyone postpones. This guide sets up automated, off-server backups in under an hour — the version that actually saves you, not the false comfort of a snapshot sitting on the same disk that fails.

## The one rule that matters

A backup on the same server it's backing up is not a backup. When the disk dies, the database corrupts, or the account gets suspended, both the data and its "backup" vanish together. Real backups live *somewhere else* — object storage, another server, your own machine. Everything below is built around that rule.

## What to back up

Two things, usually: your databases (dumped to a file) and your application files or user uploads. The operating system itself you can rebuild from your setup scripts, so it rarely needs backing up — which keeps backups small and cheap.

## Step 1 — A backup script

Create `/home/deploy/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR=/tmp/backups
mkdir -p $BACKUP_DIR

# Database
pg_dump myapp > $BACKUP_DIR/db-$DATE.sql

# Files (uploads, etc.)
tar czf $BACKUP_DIR/files-$DATE.tar.gz /var/www/myapp/uploads

# Ship off-server, then clean up local copies
rclone copy $BACKUP_DIR remote:my-backups/
rm -rf $BACKUP_DIR
```

Make it executable: `chmod +x backup.sh`.

## Step 2 — Off-server storage with rclone

`rclone` talks to virtually every object storage provider (Backblaze B2 and Cloudflare R2 are popular for being cheap; any S3-compatible store works).

```bash
sudo apt install rclone -y
rclone config
```

The interactive config sets up your "remote." Object storage for backups costs cents per month at typical sizes — genuinely negligible insurance.

## Step 3 — Automate with cron

```bash
crontab -e
```

Add a nightly 3 a.m. run:

```
0 3 * * * /home/deploy/backup.sh >> /home/deploy/backup.log 2>&1
```

Backups now happen every night without you.

## Step 4 — Retention

Without cleanup, backups accumulate forever and eventually cost real money. A lifecycle rule on the storage bucket (delete objects older than 30 days) handles this automatically on the provider side — simpler than scripting deletions.

## The step almost everyone skips

**Test a restore.** A backup you've never restored is an untested assumption. At least once, pull a backup down and confirm you can rebuild from it:

```bash
rclone copy remote:my-backups/db-2026-01-15.sql ./
psql myapp_test < db-2026-01-15.sql
```

Discovering a backup is corrupt or incomplete *during* a real disaster is how recoverable incidents become permanent losses. Ten minutes of testing now is worth more than months of backups you're merely hoping work.

## Provider snapshots as a bonus, not a plan

Many VPS hosts offer one-click snapshots — convenient for quick rollbacks, and some include them free while others charge per snapshot. Treat them as a nice extra for fast recovery, but never as your only backup: they usually live in the same infrastructure and won't help if your account is suspended or the region has a bad day. Your off-server backups are the real safety net. When comparing VPS deals, free snapshots are a genuine plus worth noting alongside the price.
