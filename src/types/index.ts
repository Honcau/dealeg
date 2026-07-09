import type { Category, SubmissionStatus } from '@prisma/client';

// Re-export Prisma enums
export type { Category, SubmissionStatus };

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
