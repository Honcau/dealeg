import { NextRequest, NextResponse } from 'next/server';
import { z }       from 'zod';
import bcrypt      from 'bcryptjs';
import { prisma }  from '@/lib/db';
import { normalizeLocale } from '@/lib/locales';

/**
 * Message của Zod ở đây CỐ Ý là CODE máy đọc, không phải câu chữ cho người:
 * `flatten().fieldErrors` sẽ trả { email: ['EMAIL_INVALID'], ... } và client tự map
 * code → t() theo locale của nó.
 *
 * Không để trống message: Zod sẽ tự chèn tiếng Anh mặc định ("Invalid email",
 * "String must contain at least 2 character(s)") — vừa không dịch được vừa là giọng
 * văn dành cho lập trình viên.
 */
const RegisterSchema = z.object({
  name:     z.string().min(2, 'NAME_MIN').max(50, 'NAME_MAX').transform(v => v.trim()),
  email:    z.string().email('EMAIL_INVALID').toLowerCase(),
  password: z.string().min(6, 'PASSWORD_MIN'),
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
      { error: { email: ['EMAIL_TAKEN'] } },
      { status: 409 },
    );
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, password: hash, language },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
