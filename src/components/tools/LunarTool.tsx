'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

/* Thuật toán âm lịch VN (Hồ Ngọc Đức) — múi giờ 7 */
const TZ = 7;
const INT = Math.floor;

function jdFromDate(dd: number, mm: number, yy: number) {
  const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  return jd;
}
function jdToDate(jd: number): [number, number, number] {
  let a: number, b: number, c: number;
  if (jd > 2299160) { a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
  else { b = 0; c = jd + 32082; }
  const d = INT((4 * c + 3) / 1461), e = c - INT((1461 * d) / 4), m = INT((5 * e + 2) / 153);
  return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
}
function newMoon(k: number) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}
const getNewMoonDay = (k: number) => INT(newMoon(k) + 0.5 + TZ / 24);
function sunLongitude(jdn: number) {
  const T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * INT(L / (Math.PI * 2));
  return L;
}
const getSunLongitude = (d: number) => INT((sunLongitude(d - 0.5 - TZ / 24) / Math.PI) * 6);
function getLunarMonth11(yy: number) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k);
  if (getSunLongitude(nm) >= 9) nm = getNewMoonDay(k - 1);
  return nm;
}
function getLeapMonthOffset(a11: number) {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1, arc = getSunLongitude(getNewMoonDay(k + i));
  do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i)); } while (arc !== last && i < 14);
  return i - 1;
}
function solar2Lunar(dd: number, mm: number, yy: number) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k);
  let a11 = getLunarMonth11(yy), b11 = a11, lunarYear: number;
  if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1); }
  else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1); }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = 0, lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = 1;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap };
}
function lunar2Solar(ld: number, lm: number, ly: number, leap: number) {
  let a11: number, b11: number;
  if (lm < 11) { a11 = getLunarMonth11(ly - 1); b11 = getLunarMonth11(ly); }
  else { a11 = getLunarMonth11(ly); b11 = getLunarMonth11(ly + 1); }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lm - 11; if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11);
    let leapMonth = leapOff - 2; if (leapMonth < 0) leapMonth += 12;
    if (leap !== 0 && lm !== leapMonth) return null;
    if (leap !== 0 || off >= leapOff) off += 1;
  }
  const monthStart = getNewMoonDay(k + off);
  return jdToDate(monthStart + ld - 1);
}

const CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
const CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];

export function LunarTool() {
  const t = useTranslations('tools.lunar');
  const today = new Date();
  const [mode, setMode] = useState<'s2l' | 'l2s'>('s2l');
  const [d, setD] = useState(today.getDate());
  const [m, setM] = useState(today.getMonth() + 1);
  const [y, setY] = useState(today.getFullYear());
  const [leap, setLeap] = useState(false);

  let result: string, canChi = '';
  if (mode === 's2l') {
    const r = solar2Lunar(d, m, y);
    result = `${r.day}/${r.month}${r.leap ? ` (${t('leap')})` : ''}/${r.year}`;
    canChi = `${CAN[(r.year + 6) % 10]} ${CHI[(r.year + 8) % 12]}`;
  } else {
    const r = lunar2Solar(d, m, y, leap ? 1 : 0);
    result = r ? `${r[0]}/${r[1]}/${r[2]}` : '—';
  }

  const inputCls = "w-20 px-2 py-2 rounded-lg border border-gray-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex gap-2">
        {(['s2l', 'l2s'] as const).map(mo => (
          <button key={mo} onClick={() => setMode(mo)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === mo ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {mo === 's2l' ? t('solarToLunar') : t('lunarToSolar')}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div><label className="text-xs text-gray-500 block mb-1">{t('day')}</label>
          <input type="number" min={1} max={31} value={d} onChange={e => setD(parseInt(e.target.value) || 1)} className={inputCls} /></div>
        <div><label className="text-xs text-gray-500 block mb-1">{t('month')}</label>
          <input type="number" min={1} max={12} value={m} onChange={e => setM(parseInt(e.target.value) || 1)} className={inputCls} /></div>
        <div><label className="text-xs text-gray-500 block mb-1">{t('year')}</label>
          <input type="number" min={1900} max={2199} value={y} onChange={e => setY(parseInt(e.target.value) || 2026)} className="w-28 px-2 py-2 rounded-lg border border-gray-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        {mode === 'l2s' && (
          <label className="flex items-center gap-2 text-sm text-gray-600 pb-2 cursor-pointer">
            <input type="checkbox" checked={leap} onChange={e => setLeap(e.target.checked)} className="accent-indigo-600" />
            {t('leap')}
          </label>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
        <div className="text-sm text-gray-400 mb-1">{mode === 's2l' ? t('lunar') : t('solar')}</div>
        <div className="font-display text-4xl font-bold text-indigo-600 tabular-nums">{result}</div>
        {canChi && <div className="text-sm text-gray-500 mt-2">{t('year')} {canChi}</div>}
      </div>
    </div>
  );
}
