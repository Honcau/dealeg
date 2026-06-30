import { NextRequest, NextResponse } from 'next/server';
import { getAdminToken, COOKIE_NAME } from '@/lib/admin-auth';
import { translateArticle }           from '@/lib/translation';

// Dịch tuần tự 11 ngôn ngữ mất ~30-60 giây → cần tăng timeout
export const runtime     = 'nodejs';
export const maxDuration = 300;  // 5 phút (Vercel Pro). Free tier tối đa 60s.

function checkAuth(req: NextRequest) {
  try { return req.cookies.get(COOKIE_NAME)?.value === getAdminToken(); }
  catch { return false; }
}

type Params = { params: Promise<{ id: string }> };

/** POST /api/admin/articles/[id]/translate — dịch sang tất cả ngôn ngữ */
export async function POST(req: NextRequest, { params }: Params) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const results = await translateArticle(id);
    const failed  = results.filter(r => !r.success);

    return NextResponse.json({
      ok:      true,
      results,
      summary: `${results.length - failed.length}/${results.length} ngôn ngữ thành công`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
