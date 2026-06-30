import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { prisma }                    from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

/** Middleware kiểm tra auth cho API admin */
function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  try { return token === getAdminToken(); }
  catch { return false; }
}

const VoucherSchema = z.object({
  code:          z.string().min(1).transform(v => v.trim().toUpperCase()),
  provider:      z.string().min(1).transform(v => v.trim()),
  category:      z.enum(['DOMAIN','HOSTING','VPN','SECURITY','EMAIL','CDN','SSL','OTHER']),
  discount:      z.string().min(1),
  discountValue: z.number().min(0).max(100),
  affiliateUrl:  z.string().url().optional().or(z.literal('')),
  expiresAt:     z.string().optional().nullable(),   // ISO date string
  isVerified:    z.boolean().default(false),
  isActive:      z.boolean().default(true),
  titleVi:       z.string().optional(),
  descVi:        z.string().optional(),
  titleEn:       z.string().optional(),
  descEn:        z.string().optional(),
});

// GET /api/admin/vouchers — danh sách tất cả
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const vouchers = await prisma.voucher.findMany({
    include: { translations: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(vouchers);
}

// POST /api/admin/vouchers — tạo mới
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = VoucherSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { titleVi, descVi, titleEn, descEn, expiresAt, ...data } = parsed.data;

  const voucher = await prisma.voucher.create({
    data: {
      ...data,
      affiliateUrl: data.affiliateUrl || null,
      expiresAt:    expiresAt ? new Date(expiresAt) : null,
      translations: {
        create: [
          ...(titleVi ? [{ locale: 'vi', title: titleVi, description: descVi ?? '' }] : []),
          ...(titleEn ? [{ locale: 'en', title: titleEn, description: descEn ?? '' }] : []),
        ],
      },
    },
    include: { translations: true },
  });

  return NextResponse.json(voucher, { status: 201 });
}
