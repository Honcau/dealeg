Passwords are the weakest link in server security — guessable, reused, and brute-forced around the clock. SSH keys replace them with cryptography that's effectively impossible to guess and far more convenient once set up: no password to type, no password to leak. If you manage any remote server, switching to key-based authentication is the single highest-value security habit you can adopt. Here's how they work and how to use them properly.

## How SSH keys work

An SSH key is a pair: a **private key** that stays on your computer and never leaves it, and a **public key** you copy to any server you want to access. The server uses the public key to issue a challenge only the matching private key can answer. Nothing secret crosses the network, so there's nothing to intercept. It's asymmetric cryptography doing what passwords never could.

## Generate a key

Use Ed25519 — modern, fast, and shorter than old RSA keys while being at least as strong:

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Accept the default location. When prompted for a passphrase, **use one** — it encrypts the private key so a stolen laptop doesn't hand over your servers. An SSH agent means you type it once per session, not per connection.

## Copy the public key to a server

```bash
ssh-copy-id user@server-ip
```

This appends your public key to the server's `~/.ssh/authorized_keys`. Now `ssh user@server-ip` logs you in with the key — no password.

## Lock the door behind you

Keys are only half the win; you must also disable password login so attackers can't fall back to brute force. On the server, in `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
PermitRootLogin no
```

Restart SSH (`sudo systemctl restart ssh`). Critically, **confirm key login works in a separate terminal before disabling passwords** — locking yourself out is the classic mistake, and on a remote VPS there's no keyboard to fix it from.

## Manage multiple keys cleanly

Juggling several servers or Git hosts? A `~/.ssh/config` file makes it painless:

```
Host myserver
    HostName 203.0.113.10
    User deploy
    IdentityFile ~/.ssh/id_ed25519

Host github.com
    IdentityFile ~/.ssh/id_ed25519_github
```

Now `ssh myserver` just works, and Git uses the right key automatically.

## Good key hygiene

**One key per device**, not one key copied everywhere — if a laptop is compromised, you revoke just its key by removing it from `authorized_keys`, without touching your other machines. **Never share or commit a private key**; treat it like the master password it effectively is. **Back up your keys** somewhere secure, because losing the private key means losing access to everything trusting it (though you can always add a new public key if you still have another way in).

## The payoff

Once set up, SSH keys are both more secure and more convenient than passwords — the rare security upgrade with no daily cost. Every VPS, Git host, and deploy pipeline supports them, and combined with a firewall and Fail2ban (see our security guides) they eliminate the overwhelming majority of real-world server break-in attempts.
