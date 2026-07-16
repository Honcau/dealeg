import { NextRequest, NextResponse } from 'next/server';
import { z }                          from 'zod';
import { Prisma }                     from '@prisma/client';
import { prisma }                     from '@/lib/db';
import { getAdminToken, COOKIE_NAME }  from '@/lib/admin-auth';

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  try { return token === getAdminToken(); }
  catch { return false; }
}

// Tất cả field optional → PUT dùng cho cả "sửa" (gửi full form) lẫn "ẩn/hiện" (chỉ gửi isActive)
const CATEGORY_ENUM = z.enum(['DOMAIN','HOSTING','VPS','VPN','SECURITY','EMAIL','CDN','SSL','AITOOL','OTHER']);

const UpdateSchema = z.object({
  name:        z.string().min(1).transform(v => v.trim()).optional(),
  website:     z.string().optional(),
  categories:  z.array(CATEGORY_ENUM).optional(),
  affiliateId: z.string().optional(),
  affiliateUrl: z.string().optional(),
  description: z.string().optional(),
  logo:        z.string().optional(),
  isActive:    z.boolean().optional(),
});

/** name → slug (a-z0-9-) */
function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// PUT /api/admin/providers/[id] — cập nhật provider (sửa hoặc ẩn/hiện)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const current = await prisma.provider.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: 'Không tìm thấy provider' }, { status: 404 });

  const d = parsed.data;
  const data: Prisma.ProviderUpdateInput = {};
  if (d.website     !== undefined) data.website     = d.website;
  if (d.categories  !== undefined) {
    data.categories = d.categories;
    data.category   = d.categories[0] ?? null;   // danh mục chính = cái đầu tiên
  }
  if (d.affiliateUrl !== undefined) data.affiliateUrl = d.affiliateUrl || null;
  if (d.description !== undefined) data.description = d.description || null;
  if (d.logo        !== undefined) data.logo        = d.logo || null;
  if (d.isActive    !== undefined) data.isActive    = d.isActive;
  if (d.affiliateId !== undefined) {
    data.affiliateId     = d.affiliateId || null;
    data.hasAffiliateApi = !!d.affiliateId;
  }
  // Đổi tên → tạo lại slug, chặn trùng (loại chính nó)
  if (d.name !== undefined && d.name !== current.name) {
    const slug = slugify(d.name);
    const dup = await prisma.provider.findFirst({
      where: { OR: [{ name: d.name }, { slug }], NOT: { id } },
    });
    if (dup) return NextResponse.json({ error: { name: ['Tên hoặc slug đã tồn tại'] } }, { status: 409 });
    data.name = d.name;
    data.slug = slug;
  }

  const updated = await prisma.provider.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/admin/providers/[id] — xoá provider
// Lưu ý: Voucher.provider là String (không FK) nên không cascade; voucher cũ vẫn giữ tên,
// nhưng trang /provider/[slug] sẽ 404 nếu không còn provider trùng slug.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.provider.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy hoặc không xoá được' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
