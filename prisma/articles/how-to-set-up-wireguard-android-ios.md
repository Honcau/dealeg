Your phone is where a VPN earns its keep — public Wi-Fi, roaming, and always-on privacy. WireGuard is ideal here: it sips battery, survives switching between Wi-Fi and mobile data without dropping, and reconnects instantly. This guide sets it up on both Android and iOS, including the QR-code trick that makes mobile setup take about thirty seconds.

## Install the official app

- **Android** — install **WireGuard** from Google Play (or F-Droid). Publisher: *WireGuard Development Team*.
- **iOS / iPadOS** — install **WireGuard** from the App Store, by the same publisher.

Only use the official app. The protocol is open-source, but you still want the genuine client.

## The fast way: scan a QR code

This is by far the easiest method if you run your own server (see the [WireGuard on Ubuntu guide](/blog/how-to-install-wireguard-ubuntu) to create one). On the server, turn a client config into a QR code:

```bash
sudo apt install -y qrencode
qrencode -t ansiutf8 < client.conf
```

A QR block prints right in your terminal. Then on the phone:

1. Open the WireGuard app and tap the **+** button.
2. Choose **Scan from QR code** (Android) or **Create from QR code** (iOS).
3. Point the camera at the terminal, give the tunnel a name, and allow the VPN permission when prompted.
4. Toggle it on.

Done — no typing, no file transfer.

## Alternative: import a file or type it in

If a provider gave you a `.conf` file, copy it to the phone and choose **Import from file or archive** (Android) or **Create from file** (iOS). Or tap **+** → **Create from scratch** and enter the same fields you would on desktop:

```ini
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY
Address = 10.8.0.5/32
DNS = 1.1.1.1

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

Give each device its own address (`10.8.0.5`, `10.8.0.6`, …) and register its public key on the server:

```bash
sudo wg set wg0 peer PHONE_PUBLIC_KEY allowed-ips 10.8.0.5/32
```

## Split tunneling and always-on

Android has a genuinely useful extra: **per-app tunneling**. Edit the tunnel and under *Applications* you can include or exclude specific apps — for example, route your banking app through the VPN but let a streaming app connect directly. iOS does not expose per-app control, but you can still limit which networks are covered with `AllowedIPs`.

Both platforms support **on-demand / always-on**: turn it on so the tunnel activates automatically whenever you leave a trusted Wi-Fi network. On Android this lives in the tunnel's settings; on iOS, enable "On-Demand" in the tunnel configuration.

## Verify

Open a browser to any "what is my IP" page. If it shows your server's address, mobile traffic is now flowing through WireGuard. In the app, the tunnel screen shows the *latest handshake* and data transferred — a recent handshake means it is working.

## Battery note

WireGuard is connectionless, so an idle tunnel costs almost nothing. Leaving it always-on is practical in a way it never was with older protocols — one of the main reasons WireGuard has become the mobile default. For how it compares under the hood, see [WireGuard vs IPsec/IKEv2](/blog/wireguard-vs-ipsec-ikev2), or choose a managed service in our [best VPN comparison](/blog/best-vpn-2026).
