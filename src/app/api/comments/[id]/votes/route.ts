/**
 * VOTE API
 * POST /api/comments/[id]/votes — vote "Still works" (+1) hoặc "Expired" (-1)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { prisma }                    from '@/lib/db';
import { getSession }                from '@/lib/auth';

const VoteSchema = z.object({
  value: z.enum(['1', '-1']).transform(v => parseInt(v)),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id: commentId } = await params;
  const parsed = VoteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { value } = parsed.data;

  // Tìm hoặc tạo vote — nếu user đã vote rồi thì cập nhật
  const existing = await prisma.vote.findUnique({
    where: { commentId_userId: { commentId, userId: session.user.id! } },
  });

  if (existing) {
    if (existing.value === value) {
      // Nếu vote lại với cùng value → xoá vote (toggle)
      await prisma.vote.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true, deleted: true });
    } else {
      // Thay đổi vote
      await prisma.vote.update({
        where: { id: existing.id },
        data: { value },
      });
    }
  } else {
    // Tạo vote mới
    await prisma.vote.create({
      data: { commentId, userId: session.user.id!, value },
    });
  }

  return NextResponse.json({ ok: true });
}
