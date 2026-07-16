import { NextRequest, NextResponse } from 'next/server';
import { z }                        from 'zod';
import { prisma }                   from '@/lib/db';
import { checkInternalAuth }        from '@/lib/internal-auth';
import { routing }                  from '@/i18n/routing';

export const dynamic = 'force-dynamic';

const LOCALES = routing.locales as readonly string[];

const UpsertSchema = z.object({
  platform: z.string().default('telegram'),
  chatId:   z.string().min(1),
  locale:   z.string().optional(),
  source:   z.string().max(200).optional(),   // payload deep-link (attribution)
});

const UpdateSchema = z.object({
  platform:   z.string().default('telegram'),
  chatId:     z.string().min(1),
  locale:     z.string().optional(),
  categories: z.array(z.string()).optional(),
  frequency:  z.enum(['instant', 'daily']).optional(),
  isActive:   z.boolean().optional(),
});

function safeLocale(l?: string): string | undefined {
  if (!l) return undefined;
  return LOCALES.includes(l) ? l : undefined;
}

/** GET /api/internal/bot/users?platform=telegram&chatId=123 — đọc 1 user (bot lấy locale đã lưu). */
export async function GET(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp       = req.nextUrl.searchParams;
  const platform = sp.get('platform') || 'telegram';
  const chatId   = sp.get('chatId');
  if (!chatId) return NextResponse.json({ error: 'Thiếu chatId' }, { status: 422 });

  const user = await prisma.botUser.findUnique({ where: { platform_chatId: { platform, chatId } } });
  if (!user) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  return NextResponse.json(user);
}

/**
 * POST /api/internal/bot/users — /start: tạo hoặc bật lại user (opt-in).
 * Opt-in lại (sau /stop) sẽ set isActive=true và làm mới optInAt.
 */
export async function POST(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = UpsertSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { platform, chatId, source } = parsed.data;
  const locale = safeLocale(parsed.data.locale) ?? 'en';

  const user = await prisma.botUser.upsert({
    where:  { platform_chatId: { platform, chatId } },
    create: { platform, chatId, locale, source: source ?? null },
    // Đã tồn tại: bật lại + làm mới mốc opt-in (không đè locale user đã tự chọn)
    update: { isActive: true, optInAt: new Date(), ...(source ? { source } : {}) },
  });

  return NextResponse.json(user);
}

/** PATCH /api/internal/bot/users — đổi locale / categories / frequency / /stop (isActive=false). */
export async function PATCH(req: NextRequest) {
  if (!checkInternalAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { platform, chatId, categories, frequency, isActive } = parsed.data;
  const locale = safeLocale(parsed.data.locale);

  try {
    const user = await prisma.botUser.update({
      where: { platform_chatId: { platform, chatId } },
      data: {
        ...(locale     !== undefined ? { locale }     : {}),
        ...(categories !== undefined ? { categories: categories.map(c => c.toLowerCase()) } : {}),
        ...(frequency  !== undefined ? { frequency }  : {}),
        ...(isActive   !== undefined ? { isActive }   : {}),
      },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Không tìm thấy bot user' }, { status: 404 });
  }
}
