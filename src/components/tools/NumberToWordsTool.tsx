'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/* ─── Tiếng Việt ─── */
const VN_DIGITS = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
function vnThree(n: number, full: boolean): string {
  const tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10;
  let s = '';
  if (full || tr > 0) s += VN_DIGITS[tr] + ' trăm';
  if (ch > 1) {
    s += ' ' + VN_DIGITS[ch] + ' mươi';
    if (dv === 1) s += ' mốt';
    else if (dv === 4) s += ' tư';
    else if (dv === 5) s += ' lăm';
    else if (dv > 0) s += ' ' + VN_DIGITS[dv];
  } else if (ch === 1) {
    s += ' mười';
    if (dv === 5) s += ' lăm';
    else if (dv > 0) s += ' ' + VN_DIGITS[dv];
  } else if (dv > 0) {
    if (full || tr > 0) s += ' lẻ';
    s += ' ' + VN_DIGITS[dv];
  }
  return s.trim();
}
function toVietnamese(n: number): string {
  if (n === 0) return 'không';
  if (n < 0) return 'âm ' + toVietnamese(-n);
  const groups: number[] = [];
  while (n > 0) { groups.unshift(n % 1000); n = Math.floor(n / 1000); }
  const units = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];
  let s = '';
  groups.forEach((g, i) => {
    const rest = groups.length - 1 - i;
    if (g > 0) s += (s ? ' ' : '') + vnThree(g, s !== '') + units[rest];
    else if (rest === 3 && groups.slice(0, i).some(x => x > 0)) s += units[3]; // "tỷ" mốc
  });
  return s.replace(/\s+/g, ' ').trim();
}

/* ─── English ─── */
const EN_ONES = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const EN_TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function enThree(n: number): string {
  let s = '';
  if (n >= 100) { s += EN_ONES[Math.floor(n / 100)] + ' hundred'; n %= 100; if (n) s += ' '; }
  if (n >= 20) { s += EN_TENS[Math.floor(n / 10)]; if (n % 10) s += '-' + EN_ONES[n % 10]; }
  else if (n > 0) s += EN_ONES[n];
  return s;
}
function toEnglish(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return 'minus ' + toEnglish(-n);
  const units = ['', ' thousand', ' million', ' billion', ' trillion'];
  const groups: number[] = [];
  while (n > 0) { groups.unshift(n % 1000); n = Math.floor(n / 1000); }
  return groups.map((g, i) => g > 0 ? enThree(g) + units[groups.length - 1 - i] : '')
    .filter(Boolean).join(' ').trim();
}

export function NumberToWordsTool() {
  const t = useTranslations('tools.num2words');
  const tc = useTranslations('tools.common');
  const [num, setNum] = useState('1250000');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [copied, setCopied] = useState(false);

  const n = parseInt(num.replace(/[^\d-]/g, '')) || 0;
  const result = Math.abs(n) < 1e18 ? (lang === 'vi' ? toVietnamese(n) : toEnglish(n)) : '—';
  const capital = result.charAt(0).toUpperCase() + result.slice(1);

  async function copy() {
    try { await navigator.clipboard.writeText(capital); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('number')}</label>
          <input inputMode="numeric" value={n.toLocaleString('vi-VN')}
            onChange={e => setNum(e.target.value.replace(/[^\d]/g, ''))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={lang} onChange={e => setLang(e.target.value as 'vi' | 'en')}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">{tc('result')}</span>
          <button onClick={copy}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}>
            {copied ? '✓ ' + tc('copied') : tc('copy')}
          </button>
        </div>
        <div className="text-lg text-gray-900 leading-relaxed">{capital}</div>
      </div>
      <p className="text-xs text-gray-400">{t('note')}</p>
    </div>
  );
}
