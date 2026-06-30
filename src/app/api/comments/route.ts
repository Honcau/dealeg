/**
 * COMMENTS API
 * POST /api/comments — thêm comment
 * GET /api/comments?voucherId=xxx — lấy comments của 1 voucher
 */
import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { prisma }                    from '@/lib/db';
import { getSession }                from '@/lib/auth';

const CreateCommentSchema = z.object({
  voucherId: z.string().min(1),
  text:      z.string().min(2).max(500),
});

// POST — thêm comment mới
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const parsed = CreateCommentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { voucherId, text } = parsed.data;

  // Kiểm tra voucher tồn tại
  const voucher = await prisma.voucher.findUnique({ where: { id: voucherId } });
  if (!voucher) {
    return NextResponse.json({ error: 'Voucher không tồn tại' }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      voucherId,
      userId: session.user.id!,
      text,
    },
    include: {
      user:  { select: { id: true, name: true, image: true } },
      votes: { select: { userId: true, value: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

// GET — lấy comments + votes của 1 voucher
export async function GET(req: NextRequest) {
  const voucherId = req.nextUrl.searchParams.get('voucherId');
  if (!voucherId) {
    return NextResponse.json({ error: 'Cần voucherId' }, { status: 422 });
  }

  const comments = await prisma.comment.findMany({
    where: { voucherId },
    include: {
      user:  { select: { id: true, name: true, image: true } },
      votes: { select: { userId: true, value: true } },
    },
    orderBy: [
      { votes: { _count: 'desc' } },  // comment có nhiều upvote lên trên
      { createdAt: 'desc' },
    ],
  });

  return NextResponse.json(comments);
}
