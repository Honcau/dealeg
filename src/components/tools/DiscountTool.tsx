'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

export function DiscountTool() {
  const t = useTranslations('tools.discount');
  const locale = useLocale();
  const [price, setPrice] = useState('500000');
  const [percent, setPercent] = useState('30');
  const [orig, setOrig] = useState('500000');
  const [sale, setSale] = useState('350000');

  const num = (s: string) => parseFloat(s.replace(/[^\d.]/g, '')) || 0;
  const fmt = (n: number) => n.toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', { maximumFractionDigits: 0 });

  const p = num(price), pc = num(percent);
  const finalPrice = p * (1 - pc / 100);
  const saved = p - finalPrice;

  const o = num(orig), s = num(sale);
  const pctOff = o > 0 ? ((o - s) / o) * 100 : 0;

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Chế độ 1: giá + % → giá cuối */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t('mode1Title')}</h2>
        <div>
          <label className="text-sm text-gray-600 block mb-1.5">{t('price')}</label>
          <input inputMode="numeric" value={fmt(p)} onChange={e => setPrice(e.target.value.replace(/[^\d]/g, ''))} className={inputCls} />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1.5">{t('percent')} (%)</label>
          <input inputMode="numeric" value={percent} onChange={e => setPercent(e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} />
        </div>
        <div className="pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-400">{t('finalPrice')}</div>
          <div className="font-display text-3xl font-bold text-indigo-600 tabular-nums">{fmt(finalPrice)}</div>
          <div className="text-sm text-green-600 mt-1">{t('saved')}: {fmt(saved)}</div>
        </div>
      </div>

      {/* Chế độ 2: giá gốc + giá sale → % */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">{t('mode2Title')}</h2>
        <div>
          <label className="text-sm text-gray-600 block mb-1.5">{t('original')}</label>
          <input inputMode="numeric" value={fmt(o)} onChange={e => setOrig(e.target.value.replace(/[^\d]/g, ''))} className={inputCls} />
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1.5">{t('salePrice')}</label>
          <input inputMode="numeric" value={fmt(s)} onChange={e => setSale(e.target.value.replace(/[^\d]/g, ''))} className={inputCls} />
        </div>
        <div className="pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-400">{t('percentOff')}</div>
          <div className="font-display text-3xl font-bold text-indigo-600 tabular-nums">
            −{pctOff.toFixed(1).replace(/\.0$/, '')}%
          </div>
        </div>
      </div>
    </div>
  );
}
