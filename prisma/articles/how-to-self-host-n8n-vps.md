n8n is an automation tool — think connecting apps, moving data between services, and building workflows — that you can self-host instead of paying per-execution cloud fees. For developers who'd rather own their automation and run unlimited workflows on a flat-cost VPS, self-hosting n8n is a satisfying setup. This guide gets it running securely with Docker, and is honest about when the hosted version is the smarter choice.

## Why self-host it

Cloud automation platforms charge by task or execution, which adds up fast for anything high-volume. Self-hosted n8n runs unlimited workflows for the flat cost of a VPS, keeps your data on infrastructure you control (relevant when workflows touch sensitive data), and lets you use community nodes freely. The trade-off is that you're now responsible for uptime, updates, and backups — fine for developers, less so for non-technical teams.

## Step 1 — Docker Compose setup

With Docker installed (see our Docker guide), create a `docker-compose.yml`:

```yaml
services:
  n8n:
    image: n8nio/n8n
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_HOST=automation.example.com
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://automation.example.com/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=a-strong-password
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```

Note the port binding to `127.0.0.1` — n8n listens only locally, and Nginx handles public access with SSL. Exposing it directly would put an automation tool with access to your connected accounts on the open internet.

## Step 2 — Nginx and SSL in front

Proxy a subdomain to n8n:

```nginx
server {
    server_name automation.example.com;
    location / {
        proxy_pass http://127.0.0.1:5678;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

The `Upgrade` headers matter — n8n uses WebSockets for its editor. Add SSL with Certbot (`sudo certbot --nginx -d automation.example.com`).

## Step 3 — Start and secure

```bash
docker compose up -d
```

Visit your subdomain, log in with the basic-auth credentials, and you're building workflows. The basic auth plus HTTPS plus localhost binding is the minimum secure baseline — an automation tool holding API keys to your other services is a high-value target, so don't skip any of the three.

## Step 4 — Persistence and backups

The `n8n_data` volume holds your workflows and credentials — back it up. Since it contains encrypted credentials to connected services, treat that backup as sensitive and store it securely off-server (see our backup guide). Losing it means rebuilding every workflow and reconnecting every service.

## Resource needs and the honest trade-off

n8n is fairly light for simple workflows — a 2 GB VPS handles a lot — but heavy workflows processing large data or running frequently want more RAM. Start modest and resize if needed.

When is hosted n8n Cloud the better call? If you value zero maintenance, don't want to own updates and security, or your team isn't technical, the subscription buys back real time and worry. Self-hosting wins for developers comfortable running infrastructure who want unlimited executions at flat cost and full data control. Run the numbers on your execution volume: at high volumes self-hosting on a cheap VPS is dramatically cheaper; at low volumes the hosted free tier may cost nothing and save you the setup. Check current VPS deals if you go the self-hosted route — this workload doesn't need premium hardware.
