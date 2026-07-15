import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/db';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  try { return token === getAdminToken(); }
  catch { return false; }
}

// GET /api/admin/submissions — danh sách deal người dùng gửi (mới nhất trước)
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const submissions = await prisma.voucherSubmission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { user: { select: { email: true } } },
  });
  return NextResponse.json(submissions);
}
