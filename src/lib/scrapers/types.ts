export interface ScrapedVoucher {
  code:          string;
  discount:      string;       // "-30%" / "3 months free"
  discountValue: number;       // số để sort: 30, 80, 0
  provider:      string;       // khớp Provider.name trong DB
  category:      string;       // 'DOMAIN' | 'HOSTING' | 'VPN' ...
  affiliateUrl:  string;
  expiresAt?:    Date;
  sourceUrl:     string;
  isVerified:    boolean;
  successRate?:  number;       // % thành công (coupert cung cấp)
}
