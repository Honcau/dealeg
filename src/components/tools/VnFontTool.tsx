'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/* Bảng TCVN3 (ABC) → Unicode — bảng chuẩn cộng đồng. Cấu trúc data để dễ sửa nếu sót ký tự. */
const TCVN3_CHARS = 'µ¸¶·¹¨»¾¼½Æ©ÇÊÈÉË®ÌÐÎÏÑªÒÕÓÔÖ×ÝØÜÞßãáâä«åèæçé¬êíëìîïóñòô­õøö÷ùúýûüþ';
const UNI_CHARS   = 'àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ';
const TCVN3_UPPER: Record<string, string> = {
  '¡': 'Ă', '¢': 'Â', '§': 'Đ', '£': 'Ê', '¤': 'Ô', '¥': 'Ơ', '¦': 'Ư',
};

function tcvn3ToUnicode(s: string) {
  let out = '';
  for (const ch of s) {
    const i = TCVN3_CHARS.indexOf(ch);
    if (i >= 0) out += UNI_CHARS[i];
    else if (TCVN3_UPPER[ch]) out += TCVN3_UPPER[ch];
    else out += ch;
  }
  return out;
}
function unicodeToTcvn3(s: string) {
  let out = '';
  for (const ch of s) {
    const low = ch.toLowerCase();
    const i = UNI_CHARS.indexOf(low);
    if (i >= 0) out += ch === low ? TCVN3_CHARS[i] : TCVN3_CHARS[i]; // TCVN3 hoa dùng font riêng; giữ mã thường
    else out += ch;
  }
  return out;
}
function removeDiacritics(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

const MODES = [
  { key: 'tcvn2uni', label: 'TCVN3 → Unicode', fn: tcvn3ToUnicode },
  { key: 'uni2tcvn', label: 'Unicode → TCVN3', fn: unicodeToTcvn3 },
  { key: 'removeTone', label: null, fn: removeDiacritics }, // label từ t()
] as const;

export function VnFontTool() {
  const t = useTranslations('tools.vnfont');
  const tc = useTranslations('tools.common');
  const [mode, setMode] = useState(0);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const output = MODES[mode].fn(input);

  async function copy() {
    try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {MODES.map((m, i) => (
          <button key={m.key} onClick={() => setMode(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === i ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {m.label ?? t('removeTone')}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{tc('input')}</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={8}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">{tc('output')}</label>
            <button onClick={copy} disabled={!output}
              className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}>
              {copied ? '✓ ' + tc('copied') : tc('copy')}
            </button>
          </div>
          <textarea value={output} readOnly rows={8}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm resize-y" />
        </div>
      </div>
      <p className="text-xs text-gray-400">{t('note')}</p>
    </div>
  );
}
