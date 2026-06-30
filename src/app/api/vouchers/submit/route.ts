import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { prisma }                    from '@/lib/db';

const Schema = z.object({
  code:     z.string().min(2).max(50).transform(v => v.trim().toUpperCase()),
  provider: z.string().min(2).max(100).transform(v => v.trim()),
  discount: z.string().max(50).optional(),
  url:      z.string().url().optional().or(z.literal('')),
  email:    z.string().email().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ', details: parsed.error.flatten() }, { status: 422 });
    }

    const { code, provider, discount, url, email } = parsed.data;

    const duplicate = await prisma.voucherSubmission.findFirst({ where: { code, provider, status: 'PENDING' } });
    if (duplicate) {
      return NextResponse.json({ error: 'Voucher này đã đang chờ duyệt' }, { status: 409 });
    }

    let userId: string | undefined;
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }

    const submission = await prisma.voucherSubmission.create({
      data: { code, provider, discount, url, userId, status: 'PENDING' }
    });

    return NextResponse.json({ success: true, id: submission.id, message: 'Cảm ơn! Deal đang chờ kiểm duyệt.' });
  } catch (err) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
