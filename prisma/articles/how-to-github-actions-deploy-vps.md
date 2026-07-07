Manually SSHing in to run `git pull` and restart your app gets old fast, and it's easy to forget a step. A GitHub Actions pipeline deploys automatically on every push: you commit, and moments later the change is live. This guide sets up a simple, secure deploy workflow to a VPS — no third-party CI service, just GitHub's built-in free tier.

## The approach

On every push to `main`, GitHub Actions connects to your VPS over SSH, pulls the latest code, rebuilds, and restarts. Secrets (the SSH key) live in GitHub's encrypted store, never in the repo. For most projects this is all the CI/CD you need.

## Step 1 — A deploy SSH key

Generate a dedicated key pair for deployment (never reuse your personal key):

```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
```

Add the **public** key (`deploy_key.pub`) to `~/.ssh/authorized_keys` on the VPS. Keep the **private** key for the next step.

## Step 2 — Store secrets in GitHub

In your repo: Settings → Secrets and variables → Actions. Add:
- `SSH_PRIVATE_KEY` — contents of the private `deploy_key`
- `SSH_HOST` — your server IP
- `SSH_USER` — your deploy user

These are encrypted and never exposed in logs.

## Step 3 — The workflow file

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/deploy/myapp
            git pull origin main
            docker compose up -d --build
```

Commit and push. Watch the Actions tab — your first automated deploy runs immediately.

## Step 4 — Make it robust

The basic version deploys even if the build fails, potentially leaving a broken site. Guard against it by building before swapping:

```yaml
            git pull origin main
            docker build -t myapp:new . && \
            docker compose up -d && \
            echo "Deployed" || echo "Build failed, keeping old version"
```

The `&&` chain means a failed build stops before touching the running app.

## Security notes worth taking seriously

Restrict the deploy key to one server and one user. Consider limiting what that user can do (a locked-down deploy account rather than full sudo). And never, ever commit secrets directly — GitHub scans for exposed keys, but the damage from a leaked credential can happen faster than any alert. This whole pipeline costs nothing on GitHub's free tier for private repos; the only infrastructure is the VPS you're deploying to.
