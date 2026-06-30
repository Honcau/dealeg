import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/db';
import { getSession }                from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) {
    return NextResponse.json({ error: 'Comment không tồn tại' }, { status: 404 });
  }

  if (comment.userId !== session.user.id) {
    return NextResponse.json({ error: 'Không được phép' }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
