import { NextRequest, NextResponse } from 'next/server';
import { syncAllOffers } from '@/lib/offers';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/offers/fetch — kéo cả hai feed (LowEndTalk + LowEndBox) về ngay.
 *
 * Logic nằm ở src/lib/offers.ts, không ở đây — sau này muốn chạy tự động theo lịch
 * (cron VPS hoặc n8n) chỉ cần thêm một route internal gọi cùng hàm đó.
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    return NextResponse.json({ ok: true, results: await syncAllOffers() });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e).slice(0, 200) }, { status: 502 });
  }
}
