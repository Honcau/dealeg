/**
 * DANH SÁCH PROVIDERS
 * Mỗi provider có slug tương ứng trên coupert.com và dealhack.com
 * Thêm provider mới: copy 1 dòng, sửa thông tin là xong.
 */
export interface Provider {
  name:         string;      // Tên trong DB (phải khớp provider.name)
  category:     string;      // enum Category
  coupertSlug:  string;      // slug trên coupert.com/coupons/[slug]
  dealhackSlug: string;      // slug trên dealhack.com/coupons/[slug]
  affiliateBase: string;     // URL gốc để ghép affiliate param
  affiliateParam?: string;   // query param: 'aff', 'ref', 'via'...
  affiliateId?:  string;     // đọc từ env
}

export const PROVIDERS: Provider[] = [
  // ── Domain ──────────────────────────────────────────────────────────────────
  {
    name: 'Namecheap', category: 'DOMAIN',
    coupertSlug: 'namecheap', dealhackSlug: 'namecheap',
    affiliateBase: 'https://www.namecheap.com',
    affiliateParam: 'aff', affiliateId: process.env.NAMECHEAP_AFFILIATE_ID,
  },
  {
    name: 'Porkbun', category: 'DOMAIN',
    coupertSlug: 'porkbun', dealhackSlug: 'porkbun',
    affiliateBase: 'https://porkbun.com',
  },
  {
    name: 'GoDaddy', category: 'DOMAIN',
    coupertSlug: 'godaddy', dealhackSlug: 'godaddy',
    affiliateBase: 'https://www.godaddy.com',
  },
  {
    name: 'NameSilo', category: 'DOMAIN',
    coupertSlug: 'namesilo', dealhackSlug: 'namesilo',
    affiliateBase: 'https://www.namesilo.com',
  },
  {
    name: 'Dynadot', category: 'DOMAIN',
    coupertSlug: 'dynadot', dealhackSlug: 'dynadot',
    affiliateBase: 'https://www.dynadot.com',
  },

  // ── Hosting ─────────────────────────────────────────────────────────────────
  {
    name: 'Hostinger', category: 'HOSTING',
    coupertSlug: 'hostinger', dealhackSlug: 'hostinger',
    affiliateBase: 'https://www.hostinger.com',
    affiliateParam: 'ref', affiliateId: process.env.HOSTINGER_AFFILIATE_ID,
  },
  {
    name: 'Bluehost', category: 'HOSTING',
    coupertSlug: 'bluehost', dealhackSlug: 'bluehost',
    affiliateBase: 'https://www.bluehost.com',
  },
  {
    name: 'SiteGround', category: 'HOSTING',
    coupertSlug: 'siteground', dealhackSlug: 'siteground',
    affiliateBase: 'https://www.siteground.com',
  },
  {
    name: 'A2 Hosting', category: 'HOSTING',
    coupertSlug: 'a2hosting', dealhackSlug: 'a2-hosting',
    affiliateBase: 'https://www.a2hosting.com',
  },
  {
    name: 'DreamHost', category: 'HOSTING',
    coupertSlug: 'dreamhost', dealhackSlug: 'dreamhost',
    affiliateBase: 'https://www.dreamhost.com',
  },

  // ── VPN ─────────────────────────────────────────────────────────────────────
  {
    name: 'NordVPN', category: 'VPN',
    coupertSlug: 'nordvpn', dealhackSlug: 'nordvpn',
    affiliateBase: 'https://nordvpn.com',
    affiliateParam: 'aff', affiliateId: process.env.NORDVPN_AFFILIATE_ID,
  },
  {
    name: 'ExpressVPN', category: 'VPN',
    coupertSlug: 'expressvpn', dealhackSlug: 'expressvpn',
    affiliateBase: 'https://www.expressvpn.com',
  },
  {
    name: 'Surfshark', category: 'VPN',
    coupertSlug: 'surfshark', dealhackSlug: 'surfshark',
    affiliateBase: 'https://surfshark.com',
  },
  {
    name: 'CyberGhost', category: 'VPN',
    coupertSlug: 'cyberghost', dealhackSlug: 'cyberghost-vpn',
    affiliateBase: 'https://www.cyberghostvpn.com',
  },
  {
    name: 'Private Internet Access', category: 'VPN',
    coupertSlug: 'privateinternetaccess', dealhackSlug: 'private-internet-access',
    affiliateBase: 'https://www.privateinternetaccess.com',
  },
];

/** Build affiliate URL: thêm ?aff=ID nếu có, không thì dùng ?ref=dealeg */
export function buildAffUrl(p: Provider): string {
  const base  = p.affiliateBase;
  const param = p.affiliateParam ?? 'ref';
  const id    = p.affiliateId || 'dealeg';
  return `${base}?${param}=${id}`;
}
