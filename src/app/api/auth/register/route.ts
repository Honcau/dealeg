import { NextRequest, NextResponse } from 'next/server';
import { z }       from 'zod';
import bcrypt      from 'bcryptjs';
import { prisma }  from '@/lib/db';
import { normalizeLocale } from '@/lib/locales';

const RegisterSchema = z.object({
  name:     z.string().min(2).max(50).transform(v => v.trim()),
  email:    z.string().email().toLowerCase(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  language: z.string().optional(),   // ngôn ngữ chọn lúc đăng ký (mặc định en)
});

export async function POST(req: NextRequest) {
  const parsed = RegisterSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { name, email, password } = parsed.data;
  const language = normalizeLocale(parsed.data.language);

  // Kiểm tra email đã tồn tại
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: { email: ['Email này đã được đăng ký'] } },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hash, language },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
