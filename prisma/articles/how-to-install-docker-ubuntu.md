Docker packages an app with everything it needs to run, so "works on my machine" becomes "works everywhere." On a VPS it's the cleanest way to run apps in isolation, deploy reproducibly, and tear things down without leaving cruft behind. This guide installs Docker correctly on Ubuntu — using the official repository, not the outdated version in Ubuntu's default packages — and covers the setup steps most tutorials skip.

## Why not just `apt install docker`?

Ubuntu's built-in `docker.io` package is often months behind and misses Docker Compose v2. The official repository gives you the current engine plus the Compose plugin. The few extra commands are worth it.

## Step 1 — Install from Docker's official repo

```bash
# Remove any old versions
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null

# Add Docker's repository
sudo apt update
sudo apt install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list

# Install
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
```

## Step 2 — Run Docker without sudo

Typing `sudo` before every command gets tedious and can cause permission headaches with mounted files. Add your user to the docker group:

```bash
sudo usermod -aG docker $USER
```

Log out and back in for it to take effect. One security note worth understanding: the docker group is effectively root-equivalent, so only add trusted users.

## Step 3 — Verify

```bash
docker run hello-world
docker compose version
```

The first pulls and runs a test container; the second confirms Compose v2 is installed (note the space — it's `docker compose`, not the old `docker-compose`).

## Step 4 — Two things that save you later

**Log rotation.** Container logs grow forever by default and will eventually fill your disk — a genuinely common cause of mysterious VPS outages. Set a global limit in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

Restart Docker after (`sudo systemctl restart docker`).

**Prune periodically.** Stopped containers and unused images accumulate. `docker system prune -a` reclaims the space — run it occasionally or in a cron job.

## A realistic expectation

Docker adds a thin layer of overhead and a learning curve; for a single simple app, running it directly can be less hassle. Where Docker earns its keep is multiple apps, teams, or anything you deploy more than once. On a modest VPS it runs plenty of containers — 4 GB RAM handles a real portfolio of small services. As always, the VPS itself is the commodity; check current provider deals rather than paying rack rate.
