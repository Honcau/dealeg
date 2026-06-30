import type { Category, JobStatus, ScrapeType, SubmissionStatus } from '@prisma/client';

// Re-export Prisma enums
export type { Category, JobStatus, ScrapeType, SubmissionStatus };

// Voucher with active translation
export interface VoucherWithTranslation {
  id: string;
  code: string;
  discount: string;
  discountValue: number | null;
  category: Category;
  provider: string;
  affiliateUrl: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  isVerified: boolean;
  successRate: number;
  useCount: number;
  createdAt: Date;
  title: string;       // from translation
  description: string | null;
}

// Scraper result
export interface ScrapedVoucher {
  code: string;
  title: string;
  description?: string;
  discount: string;
  discountValue?: number;
  expiresAt?: Date;
  sourceUrl?: string;
}

// Provider scraper config (stored as Json in DB)
export interface CheerioScrapeConfig {
  selectors: {
    container: string; // e.g. ".coupon-item"
    code: string;      // e.g. ".coupon-code"
    title: string;     // e.g. ".coupon-title"
    discount: string;  // e.g. ".discount-value"
    expiry?: string;   // e.g. ".expiry-date"
  };
}

export interface PlaywrightScrapeConfig {
  waitFor?: string;    // selector to wait for before scraping
  clickAccept?: string; // cookie accept button selector
  selectors: CheerioScrapeConfig['selectors'];
}

// API response shape
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tool definition for /tools page
export interface Tool {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  href: string;
  badge?: 'free' | 'new' | 'beta';
}
