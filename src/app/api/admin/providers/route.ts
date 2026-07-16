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

const ProviderSchema = z.object({
  name:        z.string().min(1).transform(v => v.trim()),
  website:     z.string().optional(),
  // 1 provider có thể thuộc nhiều danh mục — không bắt buộc chọn
  categories:  z.array(CATEGORY_ENUM).default([]),
  affiliateId: z.string().optional(),
  affiliateUrl: z.string().optional(),   // link affiliate mặc định của provider
  description: z.string().optional(),
  logo:        z.string().optional(),
  isActive:    z.boolean().default(true),
});

/** name → slug (a-z0-9-) */
function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// GET /api/admin/providers — danh sách (cho dropdown VoucherForm + trang quản lý)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const providers = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, slug: true, website: true,
      category: true, categories: true, affiliateId: true, affiliateUrl: true, description: true, isActive: true,
    },
  });
  return NextResponse.json(providers);
}

// POST /api/admin/providers — tạo provider mới
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = ProviderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { name, website, categories, affiliateId, affiliateUrl, description, logo, isActive } = parsed.data;
  const slug = slugify(name);

  // name & slug đều @unique → chặn trùng
  const existing = await prisma.provider.findFirst({ where: { OR: [{ name }, { slug }] } });
  if (existing) {
    return NextResponse.json(
      { error: { name: ['Provider (tên hoặc slug) đã tồn tại'] } },
      { status: 409 },
    );
  }

  const provider = await prisma.provider.create({
    data: {
      name,
      slug,
      website:         website || '',
      logo:            logo || null,
      description:     description || null,
      categories,
      category:        categories[0] ?? null,   // danh mục chính = cái đầu tiên (tương thích cũ)
      affiliateId:     affiliateId || null,
      affiliateUrl:    affiliateUrl || null,
      hasAffiliateApi: !!affiliateId,
      isActive,
    },
  });

  return NextResponse.json(provider, { status: 201 });
}
