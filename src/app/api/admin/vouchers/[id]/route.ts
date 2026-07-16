import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { prisma }                    from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  try { return token === getAdminToken(); }
  catch { return false; }
}

const CATEGORY_ENUM = z.enum(['DOMAIN','HOSTING','VPS','VPN','SECURITY','EMAIL','CDN','SSL','AITOOL','OTHER']);

const UpdateSchema = z.object({
  code:          z.string().min(1).transform(v => v.trim().toUpperCase()),
  provider:      z.string().min(1).transform(v => v.trim()),
  categories:    z.array(CATEGORY_ENUM).min(1, 'Chọn ít nhất 1 danh mục'),
  discount:      z.string().optional(),   // derive từ discountValue (không nhập tay nữa)
  discountValue: z.number().min(0).max(100),
  affiliateUrl:  z.string().url().optional().or(z.literal('')),
  sourceUrl:     z.string().url().optional().or(z.literal('')),
  expiresAt:     z.string().optional().nullable(),
  isVerified:    z.boolean(),
  isActive:      z.boolean(),
  hideCode:      z.boolean().default(false),
  titleVi:       z.string().optional(),
  descVi:        z.string().optional(),
  titleEn:       z.string().optional(),
  descEn:        z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/vouchers/[id] — lấy 1 voucher
export async function GET(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: { translations: true },
  });

  if (!voucher) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(voucher);
}

// PUT /api/admin/vouchers/[id] — cập nhật
export async function PUT(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }   = await params;
  const parsed   = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { titleVi, descVi, titleEn, descEn, expiresAt, ...data } = parsed.data;

  // Xoá translations cũ rồi tạo lại
  await prisma.voucherTranslation.deleteMany({ where: { voucherId: id } });

  const voucher = await prisma.voucher.update({
    where: { id },
    data: {
      ...data,
      category:     data.categories[0],   // danh mục chính — giữ cho các query cũ
      discount:     data.discountValue > 0 ? `-${data.discountValue}%` : '',
      affiliateUrl: data.affiliateUrl || null,
      sourceUrl:    data.sourceUrl || null,
      expiresAt:    expiresAt ? new Date(expiresAt) : null,
      updatedAt:    new Date(),
      translations: {
        create: [
          ...(titleVi ? [{ locale: 'vi', title: titleVi, description: descVi ?? '' }] : []),
          ...(titleEn ? [{ locale: 'en', title: titleEn, description: descEn ?? '' }] : []),
        ],
      },
    },
    include: { translations: true },
  });

  return NextResponse.json(voucher);
}

// DELETE /api/admin/vouchers/[id] — xoá
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.voucherTranslation.deleteMany({ where: { voucherId: id } });
  await prisma.voucher.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
