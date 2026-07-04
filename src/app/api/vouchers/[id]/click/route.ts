import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/vouchers/[id]/click
 * Ghi nhận 1 lượt click "Nhận mã" → tăng useCount.
 * Fire-and-forget từ client, không cần auth.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.voucher.update({
      where: { id },
      data:  { useCount: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Voucher không tồn tại hoặc lỗi → vẫn trả 200, không chặn UX
    return NextResponse.json({ ok: false });
  }
}
