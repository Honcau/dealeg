'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export function UnitPriceTool() {
  const t = useTranslations('tools.unitprice');
  const locale = useLocale();
  const [a, setA] = useState({ price: '50000', qty: '500' });
  const [b, setB] = useState({ price: '85000', qty: '1000' });

  const num = (s: string) => parseFloat(s.replace(/[^\d.]/g, '')) || 0;
  const fmt = (x: number) => x.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 2 });

  const perA = num(a.qty) > 0 ? num(a.price) / num(a.qty) : 0;
  const perB = num(b.qty) > 0 ? num(b.price) / num(b.qty) : 0;
  const cheaper = perA === perB ? null : perA < perB ? 'A' : 'B';
  const savePct = cheaper && Math.max(perA, perB) > 0
    ? ((Math.abs(perA - perB) / Math.max(perA, perB)) * 100).toFixed(1)
    : '0';

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500";

  const card = (label: string, st: typeof a, set: typeof setA, per: number, isCheaper: boolean) => (
    <div className={`bg-white border rounded-xl p-5 space-y-3 transition-colors ${isCheaper ? 'border-indigo-500' : 'border-gray-200'}`}>
      <h2 className="font-semibold text-gray-900 flex items-center justify-between">
        {label}
        {isCheaper && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">✓ {t('cheaper')} {savePct}%</span>}
      </h2>
      <div>
        <label className="text-xs text-gray-500 block mb-1">{t('price')}</label>
        <input inputMode="decimal" value={st.price} onChange={e => set({ ...st, price: e.target.value.replace(/[^\d.]/g, '') })} className={inputCls} />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">{t('quantity')}</label>
        <input inputMode="decimal" value={st.qty} onChange={e => set({ ...st, qty: e.target.value.replace(/[^\d.]/g, '') })} className={inputCls} />
      </div>
      <div className="pt-2 border-t border-gray-100">
        <div className="text-xs text-gray-400">{t('perUnit')}</div>
        <div className={`font-display text-2xl font-bold tabular-nums ${isCheaper ? 'text-indigo-600' : 'text-gray-700'}`}>{fmt(per)}</div>
      </div>
    </div>
  );

  return (
    <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
      {card(t('productA'), a, setA, perA, cheaper === 'A')}
      {card(t('productB'), b, setB, perB, cheaper === 'B')}
    </div>
  );
}
