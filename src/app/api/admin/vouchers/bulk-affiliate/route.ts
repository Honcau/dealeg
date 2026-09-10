import { NextRequest, NextResponse } from 'next/server';
import { z }        from 'zod';
import { prisma }   from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

const Body = z.object({
  ids:          z.array(z.string().min(1)).min(1),
  // Cùng luật với form voucher: chỉ nhận URL hợp lệ, không cho lưu link hỏng
  affiliateUrl: z.string().url(),
});

/**
 * POST /api/admin/vouchers/bulk-affiliate
 * Áp 1 link affiliate cho nhiều voucher cùng lúc (màn hình /admin/affiliate-links).
 * Body: { ids: string[], affiliateUrl: string }
 *
 * Cố ý CHỈ ghi đè affiliateUrl, không đụng sourceUrl — link gốc là dữ liệu tham khảo
 * riêng, không phải thứ đang đồng bộ.
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const { ids, affiliateUrl } = parsed.data;

  const { count } = await prisma.voucher.updateMany({
    where: { id: { in: ids } },
    data:  { affiliateUrl },
  });

  return NextResponse.json({ ok: true, updated: count });
}
