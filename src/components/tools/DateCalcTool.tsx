'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

function dateDiff(from: Date, to: Date) {
  let y = to.getFullYear() - from.getFullYear();
  let m = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  if (d < 0) { m--; d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  const totalDays = Math.floor((to.getTime() - from.getTime()) / 86400000);
  return { y, m, d, totalDays, weeks: Math.floor(totalDays / 7) };
}

export function DateCalcTool() {
  const t = useTranslations('tools.datecalc');
  const todayStr = new Date().toISOString().slice(0, 10);
  const [tab, setTab] = useState<'age' | 'diff'>('age');
  const [birth, setBirth] = useState('1995-01-01');
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(todayStr);

  const inputCls = "px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  const r = tab === 'age'
    ? dateDiff(new Date(birth), new Date())
    : dateDiff(new Date(from < to ? from : to), new Date(from < to ? to : from));

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex gap-2">
        {(['age', 'diff'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tb ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tb === 'age' ? t('tabAge') : t('tabDiff')}
          </button>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        {tab === 'age' ? (
          <div>
            <label className="text-xs text-gray-500 block mb-1">{t('birthDate')}</label>
            <input type="date" value={birth} onChange={e => setBirth(e.target.value)} className={inputCls} />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('fromDate')}</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('toDate')}</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
        <div className="font-display text-3xl font-bold text-indigo-600 tabular-nums">
          {r.y > 0 && `${r.y} ${t('years')} `}{r.m > 0 && `${r.m} ${t('months')} `}{r.d} {t('days')}
        </div>
        <div className="text-sm text-gray-400 mt-2 pt-2 border-t border-gray-100">
          = {r.totalDays.toLocaleString()} {t('totalDays')} · {r.weeks.toLocaleString()} {t('weeks')}
        </div>
      </div>
    </div>
  );
}
