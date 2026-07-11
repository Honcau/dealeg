/**
 * Danh sách ngôn ngữ dùng chung cho các <select> chọn ngôn ngữ
 * (đăng ký tài khoản, hồ sơ...). Khớp với routing.locales trong i18n.
 */
export const LOCALE_OPTIONS: { code: string; label: string }[] = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'vi', label: '🇻🇳 Tiếng Việt' },
  { code: 'zh', label: '🇨🇳 中文' },
  { code: 'hi', label: '🇮🇳 हिन्दी' },
  { code: 'es', label: '🇪🇸 Español' },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'ar', label: '🇸🇦 العربية' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'ja', label: '🇯🇵 日本語' },
  { code: 'ko', label: '🇰🇷 한국어' },
];

export const LOCALE_CODES = LOCALE_OPTIONS.map(o => o.code);

/** Chuẩn hoá về locale hợp lệ, mặc định 'en'. */
export function normalizeLocale(input: unknown): string {
  return typeof input === 'string' && LOCALE_CODES.includes(input) ? input : 'en';
}
