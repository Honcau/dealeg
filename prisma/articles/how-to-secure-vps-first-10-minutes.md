A fresh VPS gets its first bot login attempts within minutes of boot — automated scanners sweep the entire IPv4 space around the clock. The ten minutes you spend hardening a new server prevent the overwhelming majority of real-world compromises, because attackers overwhelmingly exploit weak passwords and unpatched defaults, not zero-days. Here is the exact checklist, in order.

## Minute 1–2: Update everything

```bash
apt update && apt upgrade -y
```

Fresh images ship weeks old. Patch first, then configure.

## Minute 3–4: Create a non-root user

Working as root means one typo can destroy the system and one leaked credential owns everything.

```bash
adduser deploy
usermod -aG sudo deploy
```

## Minute 5–6: SSH keys, then close the password door

On your **local machine**, generate a modern key and copy it up:

```bash
ssh-keygen -t ed25519
ssh-copy-id deploy@your-server-ip
```

Confirm you can log in as `deploy` with the key. Only then edit `/etc/ssh/sshd_config` on the server:

```
PermitRootLogin no
PasswordAuthentication no
```

Restart SSH (`sudo systemctl restart ssh`). This single change eliminates brute-force password attacks entirely — the most common compromise vector on VPSes.

## Minute 7: Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Everything not explicitly allowed is now blocked, including the database ports bots probe for.

## Minute 8: Fail2ban

```bash
sudo apt install fail2ban -y
```

The default configuration bans IPs after repeated failed SSH attempts. Zero tuning required for solid protection.

## Minute 9: Automatic security updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

Security patches now install themselves. The rare risk of an update breaking something is far smaller than the risk of running unpatched services for months.

## Minute 10: Verify

```bash
sudo ufw status && sudo systemctl status fail2ban --no-pager
```

Try one more SSH login from a new terminal *before closing your current session* — locking yourself out is the classic mistake.

## What this doesn't cover

This baseline stops opportunistic attacks, which is most of them. It does not replace application-level security (SQL injection, exposed admin panels), backups (a hacked server you can restore is an inconvenience; one you can't is a catastrophe), or monitoring. Providers differ here too: some budget hosts include free snapshots and DDoS protection, others charge extra — factor that into the real price when comparing VPS deals, not just the headline monthly rate.
