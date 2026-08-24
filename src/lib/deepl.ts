/**
 * POOL DEEPL KEY — quản lý ở /admin/deepl.
 *
 * Free tier DeepL = 500k ký tự/tháng. Dịch 12 ngôn ngữ cho nhiều bài là hết nhanh,
 * nên gộp NHIỀU key và tự xoay sang key còn quota khi 1 key hết (lỗi 456).
 * charCount/charLimit là cache lần gọi /v2/usage gần nhất — DeepL reset đầu kỳ nên
 * lần check sau tự thấy còn quota, không cần "reset" thủ công.
 */
import { prisma } from '@/lib/db';
import type { DeeplKey } from '@prisma/client';
import { DEEPL_LANG, TARGET_LOCALES } from '@/lib/deepl-langs';

export { DEEPL_LANG, TARGET_LOCALES };

/** Chuyển row DeepL key → dạng an toàn cho client (CHE key thật, không bao giờ trả nguyên). */
export function deeplKeyDto(k: DeeplKey) {
  return {
    id:             k.id,
    label:          k.label,
    keyMask:        '••••' + k.key.slice(-4),
    isFree:         k.key.trim().endsWith(':fx'),
    isActive:       k.isActive,
    charCount:      k.charCount,
    charLimit:      k.charLimit,
    remaining:      k.charLimit != null ? Math.max(0, k.charLimit - (k.charCount ?? 0)) : null,
    usageCheckedAt: k.usageCheckedAt,
    createdAt:      k.createdAt,
  };
}

/** Host DeepL theo loại key: đuôi ':fx' = Free, còn lại = Pro. */
export function deeplHost(key: string): string {
  return key.trim().endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
}

export interface DeeplUsage { count: number; limit: number }

/** Gọi /v2/usage cho 1 key. Throw nếu key sai / lỗi mạng. */
export async function fetchDeeplUsage(key: string): Promise<DeeplUsage> {
  const res = await fetch(`https://${deeplHost(key)}/v2/usage`, {
    headers: { Authorization: `DeepL-Auth-Key ${key}` },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`DeepL usage ${res.status}: ${await res.text().catch(() => '')}`);
  const d = await res.json();
  return { count: Number(d.character_count ?? 0), limit: Number(d.character_limit ?? 0) };
}

/** Cập nhật cache usage cho 1 key trong DB. Trả usage, hoặc null nếu lỗi. */
export async function refreshKeyUsage(id: string, key: string): Promise<DeeplUsage | null> {
  try {
    const u = await fetchDeeplUsage(key);
    await prisma.deeplKey.update({
      where: { id },
      data: { charCount: u.count, charLimit: u.limit, usageCheckedAt: new Date() },
    });
    return u;
  } catch {
    return null;
  }
}

/** Đánh dấu 1 key vừa hết quota (gặp 456) → cache charCount = charLimit để bị loại khỏi pool. */
export async function markKeyExhausted(key: string): Promise<void> {
  const row = await prisma.deeplKey.findUnique({ where: { key } });
  if (row?.charLimit != null) {
    await prisma.deeplKey.update({
      where: { id: row.id },
      data: { charCount: row.charLimit, usageCheckedAt: new Date() },
    });
  }
}

const STALE_MS = 60 * 60 * 1000;   // cache usage coi là cũ sau 1h → refresh trước khi chọn
const MIN_REMAINING = 100;          // còn dưới 100 ký tự coi như hết

/**
 * Chọn key còn NHIỀU quota nhất trong pool (refresh usage nếu cache cũ/chưa có).
 * Không có key DB active nào → fallback env DEEPL_API_KEY (không vỡ trước khi thêm key).
 * @param exclude key cần loại (VD key vừa gặp 456)
 */
export async function pickDeeplKey(exclude?: string): Promise<string | null> {
  const envKey = () => {
    const env = process.env.DEEPL_API_KEY;
    return env && env !== exclude ? env : null;
  };

  let keys: DeeplKey[];
  try {
    keys = await prisma.deeplKey.findMany({ where: { isActive: true } });
  } catch {
    // Bảng chưa migrate hoặc DB lỗi → fallback env, KHÔNG làm vỡ tính năng dịch
    return envKey();
  }

  if (keys.length === 0) return envKey();

  const now = Date.now();
  for (const k of keys) {
    if (k.key === exclude) continue;
    const stale = !k.usageCheckedAt || now - k.usageCheckedAt.getTime() > STALE_MS || k.charLimit == null;
    if (stale) {
      const u = await refreshKeyUsage(k.id, k.key);
      if (u) { k.charCount = u.count; k.charLimit = u.limit; }
    }
  }

  const usable = keys
    .filter(k => k.key !== exclude && k.charLimit != null && (k.charLimit - (k.charCount ?? 0)) >= MIN_REMAINING)
    .sort((a, b) => (b.charLimit! - (b.charCount ?? 0)) - (a.charLimit! - (a.charCount ?? 0)));

  return usable[0]?.key ?? null;
}

// ── LÕI DỊCH DÙNG CHUNG ──────────────────────────────────────────────────────
// Điểm dịch DUY NHẤT cho MỌI loại nội dung (bài viết, voucher, và về sau: công cụ…).
// Tự chọn key từ pool + XOAY khi 1 key hết quota (456). KHÔNG persist — caller tự lưu.

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Lỗi quota (DeepL 456) — throw riêng để vòng lặp biết mà xoay key. */
export class QuotaError extends Error {}

/** Dịch 1 BỘ text sang 1 target lang bằng 1 key (gộp trong 1 request). Throw QuotaError khi 456. */
async function deeplTranslateBatch(texts: string[], targetLang: string, apiKey: string, retries = 3): Promise<string[]> {
  const endpoint = `https://${deeplHost(apiKey)}/v2/translate`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texts, source_lang: 'EN', target_lang: targetLang, tag_handling: 'html' }),
        signal: AbortSignal.timeout(60_000),
      });

      if (res.status === 456) throw new QuotaError(`DeepL 456: ${(await res.text().catch(() => '')).slice(0, 200)}`);
      if (res.status === 429) { await sleep((attempt + 1) * 5000); continue; }   // rate limit → chờ rồi thử lại
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        if (body.includes('Quota') || res.status === 456) throw new QuotaError(`DeepL 456: ${body.slice(0, 200)}`);
        throw new Error(`DeepL ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = await res.json();
      return data.translations.map((t: { text: string }) => t.text);
    } catch (err) {
      if (err instanceof QuotaError) throw err;      // quota → không retry, để caller xoay key
      if (attempt === retries) throw err;
      await sleep((attempt + 1) * 2000);
    }
  }
  throw new Error(`DeepL: hết số lần thử cho ${targetLang}`);
}

export interface LocaleResult {
  locale:  string;
  success: boolean;
  texts?:  string[];   // kết quả dịch, cùng thứ tự input
  error?:  string;
}

/**
 * Dịch 1 BỘ text sang nhiều locale, tự chọn + XOAY key từ pool (456 → key kế).
 * Trả kết quả từng locale (texts theo đúng thứ tự input, hoặc error). Caller tự persist.
 */
export async function translateTexts(texts: string[], locales: string[] = TARGET_LOCALES): Promise<LocaleResult[]> {
  const results: LocaleResult[] = [];
  let key = await pickDeeplKey();
  let lastError = 'Không có DeepL key nào còn quota (thêm/kích hoạt key ở /admin/deepl)';

  for (const locale of locales) {
    const lang = DEEPL_LANG[locale];
    if (!lang) { results.push({ locale, success: false, error: `DeepL không hỗ trợ locale ${locale}` }); continue; }

    let done = false;
    while (!done) {
      if (!key) { results.push({ locale, success: false, error: lastError }); break; }
      try {
        const out = await deeplTranslateBatch(texts, lang, key);
        results.push({ locale, success: true, texts: out });
        await sleep(600);   // giãn cách giữa các call
        done = true;
      } catch (err) {
        if (err instanceof QuotaError) {
          lastError = err.message;
          await markKeyExhausted(key);
          key = await pickDeeplKey(key);   // key này hết → key khác, thử lại locale
        } else {
          results.push({ locale, success: false, error: String(err) });
          done = true;
        }
      }
    }
  }
  return results;
}
