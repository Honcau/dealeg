import { NextRequest, NextResponse } from 'next/server';
import { z }                    from 'zod';
import { Prisma }               from '@prisma/client';
import { prisma }               from '@/lib/db';
import { checkInternalAuth }    from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['DOMAIN','HOSTING','VPS','VPN','SECURITY','EMAIL','CDN','SSL','AITOOL','OTHER'] as const;

const VoucherIngest = z.object({
  code:          z.string().min(1).max(120),
  provider:      z.string().min(1).max(120),
  discount:      z.string().max(120).default(''),
  discountValue: z.number().nonnegative().optional(),
  category:      z.enum(CATEGORIES).default('OTHER'),
  categories:    z.array(z.enum(CATEGORIES)).optional(),
  affiliateUrl:  z.string().url().max(2000).optional(),
  sourceUrl:     z.string().url().max(2000).optional(),
  expiresAt:     z.string().datetime().optional(),
  title:         z.string().max(300).optional(),
  description:   z.string().max(4000).optional(),
});

/**
 * POST /api/internal/ingest/voucher
 * Header: Authorization: Bearer <INTERNAL_API_TOKEN>
 *
 * Tạo voucher NHÁP (isActive=false) từ nguồn tự động (n8n). Người vận hành duyệt +
 * bật ở /admin. Chống trùng theo code+provider (unique) → trùng thì skip idempotent.
 * Chỉ gọi được trong mạng Docker (Nginx đã 404 /api/internal từ internet).
 */
export async function POST(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = VoucherIngest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const d = parsed.data;

  const existing = await prisma.voucher.findUnique({
    where:  { code_provider: { code: d.code, provider: d.provider } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ ok: true, skipped: 'duplicate', id: existing.id });

  // category chính luôn đứng đầu mảng categories (giữ quy ước như form admin)
  const categories = d.categories?.length
    ? Array.from(new Set([d.category, ...d.categories]))
    : [d.category];

  try {
    const voucher = await prisma.voucher.create({
      data: {
        code:          d.code,
        provider:      d.provider,
        discount:      d.discount,
        discountValue: d.discountValue,
        category:      d.category,
        categories,
        affiliateUrl:  d.affiliateUrl,
        sourceUrl:     d.sourceUrl,
        expiresAt:     d.expiresAt ? new Date(d.expiresAt) : null,
        isActive:      false,   // DRAFT
        isVerified:    false,
        ...(d.title || d.description
          ? { translations: { create: { locale: 'en', title: d.title ?? d.code, description: d.description ?? '' } } }
          : {}),
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, created: true, id: voucher.id }, { status: 201 });
  } catch (e) {
    // Phòng race: 2 request cùng code+provider → bắt lỗi unique, coi như trùng
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ ok: true, skipped: 'duplicate' });
    }
    throw e;
  }
}
