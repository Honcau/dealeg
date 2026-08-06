This guide sets up WireGuard on Ubuntu by hand, so you understand every line rather than trusting a script. It works the same on a local Ubuntu box or on a cheap cloud VPS from a host like DigitalOcean, Vultr, or Linode — a VPS is the usual choice because it gives you a public IP to connect back to. Tested on Ubuntu 22.04 and 24.04.

If you would rather run a one-line installer, we cover that in [build your own WireGuard VPN on a VPS](/blog/how-to-wireguard-vpn-server). The manual route below is worth learning once.

## Install WireGuard

Ubuntu ships the WireGuard kernel module (built in since Linux 5.6), so you only need the userspace tools:

```bash
sudo apt update
sudo apt install -y wireguard
```

## Generate the server keys

Create a private and public key pair, readable only by root:

```bash
wg genkey | sudo tee /etc/wireguard/server_private.key | wg pubkey | sudo tee /etc/wireguard/server_public.key
sudo chmod 600 /etc/wireguard/server_private.key
```

Note both values — you will paste the private key into the server config and hand the public key to each client.

## Write the server config

Create `/etc/wireguard/wg0.conf`. Replace `SERVER_PRIVATE_KEY` with the value above, and confirm your public network interface name with `ip route get 1.1.1.1` (often `eth0` or `ens3`):

```ini
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = SERVER_PRIVATE_KEY
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
```

`10.8.0.1/24` is the private VPN subnet. The PostUp/PostDown lines turn on NAT so client traffic can reach the internet through the server.

## Enable IP forwarding

The kernel must be allowed to route packets between interfaces:

```bash
echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-wireguard.conf
sudo sysctl -p /etc/sysctl.d/99-wireguard.conf
```

## Open the firewall

If you use UFW, allow the WireGuard port and keep SSH open so you do not lock yourself out:

```bash
sudo ufw allow 51820/udp
sudo ufw allow OpenSSH
sudo ufw enable
```

## Start the tunnel

```bash
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0
sudo wg show
```

`systemctl enable` makes it survive reboots. `wg show` should list the interface with no peers yet.

## Add a client

On the client device, generate its own key pair the same way, then create a client config. Replace the placeholders — `SERVER_PUBLIC_KEY` is the server's public key, and `SERVER_IP` is your VPS's public address:

```ini
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY
Address = 10.8.0.2/32
DNS = 1.1.1.1

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

`AllowedIPs = 0.0.0.0/0` routes *all* traffic through the VPN. Now tell the server about this client — no restart needed:

```bash
sudo wg set wg0 peer CLIENT_PUBLIC_KEY allowed-ips 10.8.0.2/32
```

Give each additional client the next address (`10.8.0.3`, `10.8.0.4`, …).

## Verify it works

Bring up the client tunnel, then check your public IP has changed to the server's:

```bash
curl https://ipinfo.io/ip
```

If it shows the VPS IP, you are done. `sudo wg show` on the server will now list a recent handshake for the peer.

## Troubleshooting

- **No handshake** — the UDP port is blocked. Re-check the firewall on both the server and your VPS provider's cloud firewall.
- **Handshake but no internet** — IP forwarding or the NAT rule is missing. Confirm the interface name in the PostUp line matches `ip route`.
- **DNS not resolving** — the client needs `DNS = 1.1.1.1` (or your own resolver) in `[Interface]`.

That is a complete, self-hosted WireGuard server. Curious whether self-hosting or a commercial VPN is right for you? See [WireGuard vs OpenVPN](/blog/wireguard-vs-openvpn) and our [best VPN comparison](/blog/best-vpn-2026).
