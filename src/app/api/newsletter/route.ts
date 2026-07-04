import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const SubscribeSchema = z.object({
  email:  z.string().email('Email không hợp lệ'),
  locale: z.string().default('vi'),
  source: z.string().optional(),
});

/** POST /api/newsletter — đăng ký nhận deal qua email */
export async function POST(req: NextRequest) {
  const parsed = SubscribeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { email, locale, source } = parsed.data;

  try {
    // upsert: nếu email đã có thì cập nhật active, chưa có thì tạo mới
    await prisma.subscriber.upsert({
      where:  { email },
      create: { email, locale, source, isActive: true },
      update: { isActive: true, locale },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại' }, { status: 500 });
  }
}
