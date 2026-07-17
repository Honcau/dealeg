import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { prisma }                    from '@/lib/db';

const Schema = z.object({
  code:        z.string().min(2).max(50).transform(v => v.trim().toUpperCase()),
  provider:    z.string().min(2).max(100).transform(v => v.trim()),
  description: z.string().max(2000).optional(),
  url:         z.string().url().optional().or(z.literal('')),
  email:       z.string().email().optional().or(z.literal('')),
});

/**
 * Trả CODE máy đọc, KHÔNG trả câu chữ cho người.
 *
 * Route này không biết locale của user (không có locale trong URL, không đọc NEXT_LOCALE),
 * nên mọi prose viết ở đây đều sai với 11/12 ngôn ngữ. Client tự map code → t() theo
 * locale của nó. Xem src/app/[locale]/submit/page.tsx.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ code: 'INVALID', details: parsed.error.flatten() }, { status: 422 });
    }

    const { code, provider, description, url, email } = parsed.data;

    const duplicate = await prisma.voucherSubmission.findFirst({ where: { code, provider, status: 'PENDING' } });
    if (duplicate) {
      return NextResponse.json({ code: 'DUPLICATE' }, { status: 409 });
    }

    let userId: string | undefined;
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }

    const submission = await prisma.voucherSubmission.create({
      data: { code, provider, description, url, userId, status: 'PENDING' }
    });

    return NextResponse.json({ success: true, id: submission.id });
  } catch (err) {
    return NextResponse.json({ code: 'SERVER' }, { status: 500 });
  }
}
