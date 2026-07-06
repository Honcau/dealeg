'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const CURRENCIES = ['USD','VND','EUR','GBP','JPY','KRW','CNY','THB','SGD','AUD','CAD','HKD','TWD','MYR','IDR','PHP','INR','RUB','AED','CHF'];

export function CurrencyTool() {
  const t = useTranslations('tools.currency');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState(false);
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('VND');

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => { if (d?.rates) setRates(d.rates); else setError(true); })
      .catch(() => setError(true));
  }, []);

  const amt = parseFloat(amount.replace(/[^\d.]/g, '')) || 0;
  const result = rates ? (amt / rates[from]) * rates[to] : null;
  const unitRate = rates ? (1 / rates[from]) * rates[to] : null;

  const fmt = (n: number, cur: string) =>
    n.toLocaleString('en-US', { maximumFractionDigits: ['VND','IDR','KRW','JPY'].includes(cur) ? 0 : 2 });

  const selectCls = "px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none bg-white";

  return (
    <div className="max-w-xl space-y-6">
      {error && <p className="text-sm text-red-500">{t('error')}</p>}
      {!rates && !error && <p className="text-sm text-gray-400">{t('loading')}</p>}

      {rates && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('amount')}</label>
              <input inputMode="decimal" value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={from} onChange={e => setFrom(e.target.value)} className={selectCls}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => { setFrom(to); setTo(from); }}
              title={t('swap')}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">⇄</button>
            <select value={to} onChange={e => setTo(e.target.value)} className={selectCls}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {result !== null && (
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
              <div className="text-sm text-gray-400 mb-1">
                {fmt(amt, from)} {from} =
              </div>
              <div className="font-display text-4xl font-bold text-indigo-600 tabular-nums break-all">
                {fmt(result, to)} <span className="text-lg text-gray-400">{to}</span>
              </div>
              <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                1 {from} = {fmt(unitRate!, to)} {to}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400">{t('rateNote')}</p>
        </>
      )}
    </div>
  );
}
