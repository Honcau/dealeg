/**
 * scripts/i18n-fill.ts — TỰ ĐIỀN UI strings CÒN THIẾU bằng pool DeepL.
 *
 * Chạy on-demand (0 RAM runtime): `npm run i18n:fill`.
 * Nguồn dịch là `messages/en.json` (deepl.ts ép source_lang=EN). Với mỗi locale
 * đích, tìm key CÓ trong en nhưng THIẾU/rỗng ở locale đó → dịch qua pool DeepL
 * (tự xoay key khi 456) → ghi trả file.
 *
 * AN TOÀN:
 *  - KHÔNG bao giờ đè bản dịch đã có (chỉ lấp chỗ trống/rỗng).
 *  - Giữ nguyên thứ tự key từng file → chỉ THÊM key mới → diff git tối thiểu.
 *  - Placeholder {var}: bọc <x id="N"/> trước khi dịch, khôi phục sau (tag_handling
 *    :html của deepl.ts giữ nguyên tag) — mất placeholder thì bỏ qua key (fallback en).
 *  - ICU phức {n, plural/select ...}: KHÔNG auto-dịch (số nhiều mỗi ngôn ngữ khác) →
 *    để trống, runtime tự fallback en; in ra để tự điền tay.
 *
 * Cờ: --dry-run (chỉ liệt kê, không gọi API/không ghi) · --locale=ja (1 ngôn ngữ).
 * Env DATABASE_URL (pool DB) hoặc DEEPL_API_KEY được nạp từ .env.local rồi .env.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type Msg = { [k: string]: string | Msg };

const MESSAGES_DIR = process.env.I18N_MESSAGES_DIR || path.join(process.cwd(), 'messages');
const SOURCE_LOCALE = 'en';
const CHUNK = 45;            // DeepL giới hạn 50 text/request

// ─── Helpers thuần (tách riêng để test không cần DeepL/DB) ──────────────────────
const SIMPLE_PH   = /\{[^{}]*\}/g;
const COMPLEX_ICU = /\{[^{}]*,\s*(?:plural|select|selectordinal)\b/;

export function isComplexICU(s: string): boolean {
  return COMPLEX_ICU.test(s);
}

/** Thay mỗi {placeholder} bằng tag <x id="N"/> để DeepL giữ nguyên. */
export function protect(s: string): { masked: string; phs: string[] } {
  const phs: string[] = [];
  const masked = s.replace(SIMPLE_PH, (m) => {
    const i = phs.length;
    phs.push(m);
    return `<x id="${i}"/>`;
  });
  return { masked, phs };
}

/** Khôi phục các tag <x id="N"/> về {placeholder} gốc. Mất tag → trả null. */
export function restore(s: string, phs: string[]): string | null {
  let out = s;
  for (let i = 0; i < phs.length; i++) {
    const re = new RegExp(`<x\\s+id=["']?${i}["']?[^>]*?>(?:\\s*</x>)?`, 'i');
    if (!re.test(out)) return null;
    out = out.replace(re, () => phs[i]);   // hàm thay thế → không dính ký tự $ đặc biệt
  }
  return out;
}

export interface Missing { path: string[]; text: string; complex: boolean; }

/** Duyệt en, thu các leaf mà target thiếu hoặc để rỗng. */
export function collectMissing(en: Msg, target: Msg | undefined): Missing[] {
  const out: Missing[] = [];
  const walk = (e: Msg, t: Msg | undefined, p: string[]) => {
    for (const [k, ev] of Object.entries(e)) {
      const tv = t?.[k];
      const np = [...p, k];
      if (typeof ev === 'object' && ev !== null) {
        walk(ev, (typeof tv === 'object' && tv !== null) ? tv : undefined, np);
      } else {
        const missing = typeof tv !== 'string' || tv.trim() === '';
        if (missing) out.push({ path: np, text: ev as string, complex: isComplexICU(ev as string) });
      }
    }
  };
  walk(en, target, []);
  return out;
}

export const pk = (p: string[]) => p.join('\u0000');   // NUL: an toàn, không xuất hiện trong key JSON

/**
 * Dựng object kết quả: giữ nguyên key + thứ tự của target, lấp giá trị đã dịch vào
 * chỗ trống, rồi THÊM (cuối object cha) các key en mà target thiếu. Key không dịch
 * được (ICU phức / lỗi) bị bỏ qua → runtime fallback en.
 */
export function mergeFilled(en: Msg, target: Msg, filled: Map<string, string>, p: string[] = []): Msg {
  const out: Msg = {};
  const tset = new Set(Object.keys(target));

  for (const k of Object.keys(target)) {
    const tv = target[k];
    const ev = en[k];
    const np = [...p, k];
    if (typeof tv === 'object' && tv !== null) {
      out[k] = mergeFilled((typeof ev === 'object' && ev !== null) ? ev : {}, tv, filled, np);
    } else if (typeof tv === 'string' && tv.trim() !== '') {
      out[k] = tv;                               // giữ bản dịch cũ (không đè)
    } else {
      out[k] = filled.get(pk(np)) ?? tv;         // rỗng → lấp nếu có, không thì giữ nguyên
    }
  }

  for (const k of Object.keys(en)) {
    if (tset.has(k)) continue;
    const ev = en[k];
    const np = [...p, k];
    if (typeof ev === 'object' && ev !== null) {
      const sub = mergeFilled(ev, {}, filled, np);
      if (Object.keys(sub).length) out[k] = sub;
    } else {
      const f = filled.get(pk(np));
      if (f !== undefined) out[k] = f;           // bỏ qua nếu chưa dịch → fallback en
    }
  }
  return out;
}

// ─── Phần gọi DeepL (nhận translate qua tham số → test mock được) ───────────────
type TranslateFn = (
  texts: string[], locales: string[],
) => Promise<{ locale: string; success: boolean; texts?: string[]; error?: string }[]>;

export async function translateForLocale(
  locale: string, items: Missing[], translate: TranslateFn,
): Promise<{ filled: Map<string, string>; failed: number }> {
  const filled = new Map<string, string>();
  let failed = 0;
  const simple = items.filter(i => !i.complex);

  for (let i = 0; i < simple.length; i += CHUNK) {
    const batch = simple.slice(i, i + CHUNK);
    const masked = batch.map(b => protect(b.text));
    const [res] = await translate(masked.map(m => m.masked), [locale]);
    if (!res || !res.success || !res.texts) {
      failed += batch.length;
      console.error(`    ✗ ${locale}: lô ${i}–${i + batch.length}: ${res?.error ?? 'không rõ'}`);
      continue;
    }
    res.texts.forEach((t, j) => {
      const restored = restore(t, masked[j].phs);
      if (restored === null) {
        failed++;
        console.error(`    ⚠ ${locale}: mất placeholder ở "${batch[j].path.join('.')}" → bỏ qua (fallback en)`);
      } else {
        filled.set(pk(batch[j].path), restored);
      }
    });
  }
  return { filled, failed };
}

// ─── I/O ────────────────────────────────────────────────────────────────────────
const readMsg  = async (l: string): Promise<Msg> =>
  JSON.parse(await fs.readFile(path.join(MESSAGES_DIR, `${l}.json`), 'utf8'));
const writeMsg = async (l: string, d: Msg): Promise<void> =>
  fs.writeFile(path.join(MESSAGES_DIR, `${l}.json`), JSON.stringify(d, null, 2) + '\n', 'utf8');

/** Nạp .env.local rồi .env (không đè biến shell đã có). Chạy TRƯỚC khi import deepl. */
async function loadEnv(): Promise<void> {
  for (const f of ['.env.local', '.env']) {
    try {
      const txt = await fs.readFile(path.join(process.cwd(), f), 'utf8');
      for (const line of txt.split('\n')) {
        const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
        if (!m) continue;
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (process.env[m[1]] === undefined) process.env[m[1]] = v;
      }
    } catch { /* file tùy chọn */ }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const DRY  = args.includes('--dry-run');
  const localeArg = args.find(a => a.startsWith('--locale='))?.split('=')[1];

  await loadEnv();
  // Dynamic import: env phải sẵn TRƯỚC khi Prisma (trong deepl.ts) khởi tạo.
  const { translateTexts, TARGET_LOCALES } = await import('@/lib/deepl');

  const en = await readMsg(SOURCE_LOCALE);
  const targets = (localeArg ? [localeArg] : TARGET_LOCALES).filter((l: string) => l !== SOURCE_LOCALE);
  console.log(`Nguồn ${SOURCE_LOCALE} → ${targets.join(', ')}  ·  ${MESSAGES_DIR}${DRY ? '  ·  DRY-RUN' : ''}\n`);

  let grandChars = 0, grandFilled = 0;
  for (const locale of targets) {
    let target: Msg;
    try { target = await readMsg(locale); } catch { target = {}; }

    const missing = collectMissing(en, target);
    if (missing.length === 0) { console.log(`✓ ${locale}: đủ`); continue; }

    const simple  = missing.filter(m => !m.complex);
    const complex = missing.filter(m => m.complex);
    const chars   = simple.reduce((n, m) => n + m.text.length, 0);
    grandChars += chars;

    console.log(`${locale}: thiếu ${missing.length} (dịch ${simple.length}, ~${chars} ký tự`
      + (complex.length ? `; ${complex.length} ICU phức → để tay` : '') + ')');
    complex.forEach(c => console.log(`    ⏭  ${c.path.join('.')} = ${JSON.stringify(c.text)}`));

    if (DRY) continue;

    const { filled, failed } = await translateForLocale(locale, missing, translateTexts);
    if (filled.size === 0) { console.log(`    (không điền được key nào)`); continue; }
    await writeMsg(locale, mergeFilled(en, target, filled));
    grandFilled += filled.size;
    console.log(`    ✓ điền ${filled.size} key${failed ? `, ${failed} lỗi/bỏ qua` : ''} → messages/${locale}.json`);
  }

  console.log('\n' + (DRY
    ? `[DRY] tổng cần dịch ~${grandChars} ký tự. Bỏ --dry-run để chạy thật.`
    : `Xong — điền tổng ${grandFilled} key. Xem lại git diff rồi commit messages/*.json.`));
}

const invokedDirectly = !!process.argv[1] && /i18n-fill/.test(process.argv[1]);
if (invokedDirectly) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
