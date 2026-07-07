Running `node server.js` over SSH works until you close the terminal and the app dies. PM2 is the process manager that fixes this: it keeps Node apps alive, restarts them on crashes, survives server reboots, and runs multiple instances across CPU cores. For any Node app on a VPS not wrapped in Docker, PM2 is the standard tool. Here's the practical setup.

## Install and start

```bash
npm install -g pm2
pm2 start server.js --name myapp
```

Your app now runs in the background, detached from your SSH session. Close the terminal — it keeps running.

## Survive reboots

By default PM2 forgets everything when the server restarts. Two commands fix that permanently:

```bash
pm2 startup
pm2 save
```

The first prints a command to enable PM2 on boot (run it). The second snapshots your current process list. Now a reboot brings every app back automatically.

## Use every CPU core

Node runs single-threaded, so on a 2-core VPS a single instance wastes half your CPU. Cluster mode spawns one instance per core and load-balances between them:

```bash
pm2 start server.js -i max
```

For a typical API this roughly doubles throughput on a 2-core box for free. The caveat: your app must be stateless (no in-memory sessions or local-only caches), since requests hit different instances. Store shared state in Redis or your database.

## Zero-downtime deploys

Restarting normally drops requests during the gap. Reload restarts instances one at a time so the app stays available throughout:

```bash
pm2 reload myapp
```

Combined with a git-pull deploy, this gives seamless updates without a load balancer.

## Logs and monitoring

```bash
pm2 logs myapp        # live tail
pm2 monit             # live CPU/memory dashboard
```

Logs are captured automatically. Install `pm2 install pm2-logrotate` so they don't fill the disk — a classic oversight that takes servers down weeks later.

## PM2 or Docker?

Honest answer: for a single Node app on a dedicated VPS, PM2 is simpler and lighter. Docker wins when you run multiple apps needing isolation, want reproducible environments across machines, or already use containers elsewhere. They're not mutually exclusive — some teams run PM2 *inside* containers — but for most solo Node projects, PM2 alone is enough and gets you to production faster. Whichever you choose, the VPS underneath is the same commodity; shop the deals rather than overpaying for horsepower a small app won't use.
