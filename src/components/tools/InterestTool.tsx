'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

export function InterestTool() {
  const t = useTranslations('tools.interest');
  const [tab, setTab] = useState<'loan' | 'savings'>('loan');
  const [amount, setAmount] = useState('500000000');
  const [rate, setRate] = useState('9');
  const [months, setMonths] = useState('24');
  const [method, setMethod] = useState<'declining' | 'annuity'>('declining');

  const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN');
  const P = parseInt(amount.replace(/[^\d]/g, '')) || 0;
  const r = (parseFloat(rate) || 0) / 100 / 12;
  const n = parseInt(months) || 1;

  const result = useMemo(() => {
    if (P <= 0 || n <= 0) return null;
    if (tab === 'savings') {
      const simple = P * r * n;
      const compound = P * Math.pow(1 + r, n) - P;
      return { simple, compound, totalSimple: P + simple, totalCompound: P + compound };
    }
    if (method === 'annuity') {
      const pay = r > 0 ? (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : P / n;
      return { monthly: pay, totalInterest: pay * n - P, total: pay * n };
    }
    // Dư nợ giảm dần: gốc chia đều, lãi trên dư nợ còn lại
    const principal = P / n;
    let totalInterest = 0;
    for (let i = 0; i < n; i++) totalInterest += (P - principal * i) * r;
    return {
      firstPay: principal + P * r,
      lastPay: principal + principal * r,
      totalInterest,
      total: P + totalInterest,
    };
  }, [P, r, n, tab, method]);

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex gap-2">
        {(['loan', 'savings'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tb ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tb === 'loan' ? t('tabLoan') : t('tabSavings')}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('amount')} (VND)</label>
          <input inputMode="numeric" value={P.toLocaleString('vi-VN')}
            onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('rate')}</label>
          <input inputMode="decimal" value={rate} onChange={e => setRate(e.target.value.replace(/[^\d.]/g, ''))} className={inputCls} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('term')}</label>
          <input inputMode="numeric" value={months} onChange={e => setMonths(e.target.value.replace(/[^\d]/g, ''))} className={inputCls} />
        </div>
      </div>

      {tab === 'loan' && (
        <div className="flex gap-2">
          {(['declining', 'annuity'] as const).map(m => (
            <button key={m} onClick={() => setMethod(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                method === m ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-white text-gray-500 border border-gray-200'
              }`}>
              {m === 'declining' ? t('methodDeclining') : t('methodAnnuity')}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 space-y-3 text-sm">
          {tab === 'savings' ? (
            <>
              <Row label={`${t('totalInterest')} (${t('simple')})`} value={fmt((result as {simple:number}).simple)} big />
              <Row label={`${t('totalInterest')} (${t('compound')})`} value={fmt((result as {compound:number}).compound)} />
              <Row label={t('totalPayment')} value={fmt((result as {totalSimple:number}).totalSimple)} />
            </>
          ) : method === 'annuity' ? (
            <>
              <Row label={t('monthlyPayment')} value={fmt((result as {monthly:number}).monthly)} big />
              <Row label={t('totalInterest')} value={fmt((result as {totalInterest:number}).totalInterest)} />
              <Row label={t('totalPayment')} value={fmt((result as {total:number}).total)} />
            </>
          ) : (
            <>
              <Row label={t('firstPayment')} value={fmt((result as {firstPay:number}).firstPay)} big />
              <Row label={t('lastPayment')} value={fmt((result as {lastPay:number}).lastPay)} />
              <Row label={t('totalInterest')} value={fmt((result as {totalInterest:number}).totalInterest)} />
              <Row label={t('totalPayment')} value={fmt((result as {total:number}).total)} />
            </>
          )}
        </div>
      )}
      <p className="text-xs text-gray-400">{t('note')}</p>
    </div>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-gray-500">{label}</span>
      <span className={big
        ? 'font-display text-2xl font-bold text-indigo-600 tabular-nums'
        : 'font-mono text-gray-800 tabular-nums'}>
        {value} ₫
      </span>
    </div>
  );
}
