import { NextRequest, NextResponse } from 'next/server';
import { z }                          from 'zod';
import { prisma }                     from '@/lib/db';
import { getAdminToken, COOKIE_NAME }  from '@/lib/admin-auth';

function checkAuth(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  try { return token === getAdminToken(); }
  catch { return false; }
}

const StatusSchema = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) });

// PATCH /api/admin/submissions/[id] — đổi trạng thái (duyệt / từ chối)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const parsed = StatusSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const updated = await prisma.voucherSubmission.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy submission' }, { status: 404 });
  }
}

// DELETE /api/admin/submissions/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.voucherSubmission.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy hoặc không xoá được' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
