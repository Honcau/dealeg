/**
 * LISTMONK CLIENT (Phase 0 — email infrastructure)
 *
 * dealeg là proxy mỏng: form đăng ký → route API → Listmonk admin API.
 * Listmonk lo double opt-in, welcome email, preference center, gửi campaign.
 *
 * Env cần (xem LISTMONK_SETUP.md):
 *   LISTMONK_URL         = https://mail.dealeg.com   (gốc, không có / cuối)
 *   LISTMONK_API_USER    = tên API user tạo trong Listmonk
 *   LISTMONK_API_TOKEN   = token của API user đó
 *   LISTMONK_LIST_MAP    = JSON map locale→listId, vd {"vi":1,"en":2,"de":3}
 *   LISTMONK_DEFAULT_LIST_ID = listId dùng khi locale không có trong map
 *
 * Nếu chưa cấu hình (Listmonk chưa deploy) → isListmonkConfigured()=false,
 * route sẽ fallback lưu vào bảng Subscriber cục bộ để không mất lead.
 */

const URL_BASE = (process.env.LISTMONK_URL ?? '').replace(/\/+$/, '');
const API_USER = process.env.LISTMONK_API_USER ?? '';
const API_TOKEN = process.env.LISTMONK_API_TOKEN ?? '';

export function isListmonkConfigured(): boolean {
  return Boolean(URL_BASE && API_USER && API_TOKEN);
}

/** Map locale → danh sách listId của Listmonk (từ env). */
export function listIdsForLocale(locale: string): number[] {
  let map: Record<string, number> = {};
  try {
    map = JSON.parse(process.env.LISTMONK_LIST_MAP ?? '{}');
  } catch {
    map = {};
  }
  const fromMap = map[locale];
  const fallback = Number(process.env.LISTMONK_DEFAULT_LIST_ID ?? 0);
  const id = fromMap ?? (fallback || undefined);
  return id ? [id] : [];
}

export interface SubscribeInput {
  email: string;
  name?: string;
  locale: string;
  /** Thuộc tính tuỳ ý lưu kèm subscriber (source, frequency...). */
  attribs?: Record<string, unknown>;
}

export interface SubscribeResult {
  ok: boolean;
  alreadyExists: boolean;
}

/**
 * Thêm subscriber vào Listmonk. preconfirm_subscriptions=false → với list
 * double-opt-in, Listmonk tự gửi email xác nhận (double opt-in) + welcome.
 */
export async function subscribeToListmonk(input: SubscribeInput): Promise<SubscribeResult> {
  if (!isListmonkConfigured()) {
    throw new Error('Listmonk chưa được cấu hình (thiếu LISTMONK_URL/USER/TOKEN)');
  }

  // Phân nhóm newsletter theo NGÔN NGỮ.
  const lists = listIdsForLocale(input.locale);

  const res = await fetch(`${URL_BASE}/api/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Listmonk ≥ v3 API-user scheme
      Authorization: `token ${API_USER}:${API_TOKEN}`,
    },
    body: JSON.stringify({
      email: input.email,
      name: input.name || input.email.split('@')[0],
      status: 'enabled',
      lists,
      attribs: { locale: input.locale, ...input.attribs },
      preconfirm_subscriptions: false, // để Listmonk gửi double opt-in
    }),
    // Không cache
    cache: 'no-store',
  });

  if (res.ok) {
    return { ok: true, alreadyExists: false };
  }

  // Email đã tồn tại → Listmonk trả 409/error "already exists". Coi như thành công.
  const text = await res.text().catch(() => '');
  if (res.status === 409 || /already exists|duplicate|violates unique/i.test(text)) {
    return { ok: true, alreadyExists: true };
  }

  throw new Error(`Listmonk API ${res.status}: ${text.slice(0, 200)}`);
}
