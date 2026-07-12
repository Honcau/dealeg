import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { isListmonkConfigured, subscribeToListmonk } from '@/lib/listmonk';

const SubscribeSchema = z.object({
  email:      z.string().email('Email không hợp lệ'),
  locale:     z.string().default('vi'),
  source:     z.string().optional(),
  frequency:  z.enum(['weekly', 'daily']).default('weekly'),
});

/**
 * POST /api/newsletter — đăng ký nhận deal qua email.
 *
 * Listmonk-centric: nếu Listmonk đã cấu hình → đẩy sang Listmonk (double opt-in +
 * welcome do Listmonk lo) và trả pending=true (user cần bấm xác nhận trong email).
 * Nếu chưa cấu hình (hoặc Listmonk lỗi) → fallback lưu vào bảng Subscriber để không
 * mất lead. Luôn ghi 1 bản ghi cục bộ làm log/analytics của dealeg.
 */
export async function POST(req: NextRequest) {
  const parsed = SubscribeSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { email, locale, source, frequency } = parsed.data;

  // Bản ghi cục bộ (log/analytics + fallback).
  const saveLocal = () =>
    prisma.subscriber.upsert({
      where:  { email },
      create: { email, locale, source, frequency, isActive: true },
      update: { isActive: true, locale, frequency },
    });

  try {
    if (isListmonkConfigured()) {
      const r = await subscribeToListmonk({
        email,
        locale,
        attribs: { source, frequency },
      });
      await saveLocal().catch(() => {}); // mirror, không chặn
      // pending=true → cần xác nhận email (double opt-in) cho subscriber mới.
      return NextResponse.json({ ok: true, pending: !r.alreadyExists });
    }

    // Listmonk chưa cấu hình → chỉ lưu cục bộ (single opt-in tạm thời).
    await saveLocal();
    return NextResponse.json({ ok: true, pending: false });
  } catch (err) {
    // Listmonk lỗi → vẫn cứu lead bằng bản ghi cục bộ.
    console.error('[newsletter] Listmonk failed, fallback to local:', err);
    try {
      await saveLocal();
      return NextResponse.json({ ok: true, pending: false });
    } catch {
      return NextResponse.json({ error: 'Có lỗi xảy ra, thử lại' }, { status: 500 });
    }
  }
}
