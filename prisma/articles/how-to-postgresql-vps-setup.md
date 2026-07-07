Managed databases are convenient and expensive — often more per month than the VPS running your entire app. For side projects and many production workloads, PostgreSQL installed directly on your VPS is free, fast (no network hop), and entirely under your control. The trade-off is that backups and tuning become your job. This guide covers a proper setup, including the security steps that turn a database from a liability into an asset.

## Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
```

PostgreSQL starts automatically and creates a `postgres` system user. Verify:

```bash
sudo systemctl status postgresql --no-pager
```

## Create a database and user

Never let your app connect as the superuser. Create a dedicated role and database:

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE myapp;
CREATE USER myapp_user WITH ENCRYPTED PASSWORD 'a-strong-password';
GRANT ALL PRIVILEGES ON DATABASE myapp TO myapp_user;
\q
```

## The critical security step

By default PostgreSQL listens only on localhost — which is exactly what you want if the app runs on the same VPS. Bots constantly scan port 5432 for exposed databases, and an exposed database with a weak password is compromised in hours. Confirm it's not listening publicly:

```bash
sudo ss -tlnp | grep 5432
```

You should see `127.0.0.1:5432`, not `0.0.0.0:5432`. If your app is on the same server, leave it this way and connect via `localhost`. Only open it to the network if a separate app server genuinely needs it — and then only to a specific IP via the firewall, never to the world.

## Connect from your app

The connection string for a same-server setup:

```
postgresql://myapp_user:password@localhost:5432/myapp
```

Store it in an environment variable, never in code.

## Backups — do this before you need it

The one non-negotiable. A single command dumps the whole database:

```bash
pg_dump myapp > backup.sql
```

Automate it with cron (see our VPS backup guide) and — this is the part people skip — copy the dump *off the server* to object storage. A backup sitting on the same VPS that dies with it is not a backup. Test a restore at least once; a backup you've never restored is a hope, not a plan.

## Basic tuning

Default PostgreSQL settings are conservative, sized for tiny machines. On a 4 GB VPS, raising `shared_buffers` to about 1 GB and `effective_cache_size` to around 3 GB in `postgresql.conf` noticeably improves performance. Don't over-tune — these two settings capture most of the easy gains.

## When managed is worth it

If your app is revenue-critical and you can't afford downtime, a managed database's automated failover, point-in-time recovery, and 3 a.m. patching may justify the premium. The self-hosted route is ideal for side projects, early-stage products, and anyone comfortable owning backups. Either way, running the database on the same cheap VPS as your app — at least early on — saves real money; compare VPS deals with enough RAM to hold your working set in memory.
