WireGuard on Windows is the official app doing the work, and it is refreshingly simple: a tunnel is one text file, and connecting is one click. This guide covers using Windows as a **client** (the common case — connecting to a server you or a provider runs) and a note on running a **server** on Windows. It applies to Windows 10 and 11.

## Install the app

Download the official installer from **wireguard.com/install** (or get "WireGuard" from the Microsoft Store). Both come straight from the WireGuard project — avoid third-party downloads. Run it; you now have a "WireGuard" app in the Start menu.

## Option A: import a config file

If you already have a `.conf` file — for example the client config from our [WireGuard on Ubuntu guide](/blog/how-to-install-wireguard-ubuntu), or one your VPN provider gave you — this is the fastest path:

1. Open WireGuard.
2. Click the arrow next to **Add Tunnel** → **Import tunnel(s) from file**.
3. Select the `.conf` file.
4. Click **Activate**.

That is it. The status turns to *Active* and all your traffic now goes through the tunnel.

## Option B: create the tunnel by hand

If you are pairing Windows with your own Linux server and want Windows to generate its own keys:

1. In WireGuard, click the arrow next to **Add Tunnel** → **Add empty tunnel**.
2. The app auto-generates a key pair and shows the **public key** at the top — copy it; the server needs it.
3. Fill in the tunnel, replacing the placeholders:

```ini
[Interface]
PrivateKey = (already filled in by the app)
Address = 10.8.0.2/32
DNS = 1.1.1.1

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

4. Click **Save**, then add this Windows machine as a peer on the server:

```bash
sudo wg set wg0 peer WINDOWS_PUBLIC_KEY allowed-ips 10.8.0.2/32
```

5. Back in Windows, click **Activate**.

## Split tunneling: route only some traffic

`AllowedIPs = 0.0.0.0/0` sends everything through the VPN. To route only your company or home network and leave normal browsing direct, list just those ranges instead:

```ini
AllowedIPs = 10.8.0.0/24, 192.168.1.0/24
```

## Verify

Open a browser to any "what is my IP" page, or run in PowerShell:

```bash
curl https://ipinfo.io/ip
```

If it shows the server's IP, the tunnel is live.

## Running a server on Windows

You *can* make Windows the server: use **Add empty tunnel**, set a `ListenPort`, and add a `[Peer]` block for each client. The catch is routing client traffic to the internet — Windows does not do NAT as cleanly as Linux, so you would need to enable IP routing and Internet Connection Sharing, then open the UDP port in Windows Firewall. For a full "route all my traffic" VPN server, a Linux VPS is genuinely easier and cheaper. Windows-as-server makes sense mainly for reaching one specific PC remotely, not as a general gateway.

## Troubleshooting

- **Stuck with no handshake** — the server's UDP port is not reachable. Check Windows Firewall and, if you are the server, the cloud provider's firewall.
- **Connected but no internet** — usually a server-side NAT/forwarding problem, not Windows. See the [Ubuntu setup guide](/blog/how-to-install-wireguard-ubuntu).
- **Latest handshake keeps aging** — add `PersistentKeepalive = 25` so the tunnel stays open behind NAT.

For the bigger picture on protocols, see [WireGuard vs OpenVPN](/blog/wireguard-vs-openvpn), or pick a ready-made service in our [best VPN comparison](/blog/best-vpn-2026).
