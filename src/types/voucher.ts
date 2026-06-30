// Phải khớp với enum Category trong prisma/schema.prisma
export type VoucherCategory =
  | 'domain'
  | 'hosting'
  | 'vpn'
  | 'security'
  | 'email'
  | 'cdn'
  | 'ssl'
  | 'other';

export type DiscountType = 'percentage' | 'fixed' | 'free';

export interface Voucher {
  id:            string;
  provider:      string;
  logo?:         string;
  category:      VoucherCategory;
  code:          string;
  description:   string;
  discountType:  DiscountType;
  discountValue: number;
  currency?:     string;
  expiresAt?:    Date;
  isVerified:    boolean;
  usedCount:     number;
  affiliateUrl:  string;
  conditions?:   string;
  createdAt:     Date;
  updatedAt:     Date;
}

export interface VoucherFilters {
  category?:      VoucherCategory;
  provider?:      string;
  discountMin?:   number;
  onlyVerified?:  boolean;
  excludeExpired?: boolean;
}
