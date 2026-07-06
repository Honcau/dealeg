'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

/**
 * THÔNG SỐ 2026 — cập nhật khi luật thay đổi:
 * - Giảm trừ gia cảnh (NQ 110/2025/UBTVQH15, Luật Thuế TNCN 109/2025/QH15, từ kỳ thuế 2026)
 * - Biểu thuế 5 bậc (Luật 109/2025/QH15)
 * - BH bắt buộc: BHXH 8% + BHYT 1.5% (trần 20× mức tham chiếu 2.34tr = 46.8tr)
 *   BHTN 1% (trần 20× lương tối thiểu vùng, NĐ 293/2025/NĐ-CP từ 01/01/2026)
 */
const DEDUCT_SELF = 15_500_000;
const DEDUCT_DEP  = 6_200_000;
const CAP_BHXH_BHYT = 46_800_000;
const REGION_MIN_WAGE = [5_310_000, 4_730_000, 4_140_000, 3_700_000]; // Vùng I-IV 2026
// Biểu thuế 5 bậc 2026: [trần bậc, thuế suất]
const TAX_BRACKETS: [number, number][] = [
  [10_000_000, 0.05],
  [30_000_000, 0.10],
  [60_000_000, 0.20],
  [100_000_000, 0.30],
  [Infinity, 0.35],
];

function calcInsurance(gross: number, region: number) {
  const bhxh = 0.08  * Math.min(gross, CAP_BHXH_BHYT);
  const bhyt = 0.015 * Math.min(gross, CAP_BHXH_BHYT);
  const bhtn = 0.01  * Math.min(gross, 20 * REGION_MIN_WAGE[region]);
  return { bhxh, bhyt, bhtn, total: bhxh + bhyt + bhtn };
}

function calcTax(taxable: number) {
  if (taxable <= 0) return 0;
  let tax = 0, prev = 0;
  for (const [cap, rate] of TAX_BRACKETS) {
    if (taxable > prev) tax += (Math.min(taxable, cap) - prev) * rate;
    prev = cap;
    if (taxable <= cap) break;
  }
  return tax;
}

function grossToNet(gross: number, deps: number, region: number) {
  const ins = calcInsurance(gross, region);
  const beforeTax = gross - ins.total;
  const taxable = Math.max(0, beforeTax - DEDUCT_SELF - deps * DEDUCT_DEP);
  const tax = calcTax(taxable);
  return { gross, net: beforeTax - tax, ins, taxable, tax };
}

function netToGross(net: number, deps: number, region: number) {
  // Tìm gross bằng nhị phân (hàm gross→net đơn điệu tăng)
  let lo = net, hi = net * 2 + 50_000_000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (grossToNet(mid, deps, region).net < net) lo = mid; else hi = mid;
  }
  return grossToNet(Math.round(hi), deps, region);
}

export function GrossNetTool() {
  const t = useTranslations('tools.grossnet');
  const [mode, setMode] = useState<'g2n' | 'n2g'>('g2n');
  const [input, setInput] = useState('30000000');
  const [deps, setDeps] = useState(0);
  const [region, setRegion] = useState(0);

  const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN');

  const result = useMemo(() => {
    const val = parseInt(input.replace(/[^\d]/g, '')) || 0;
    if (val <= 0) return null;
    return mode === 'g2n' ? grossToNet(val, deps, region) : netToGross(val, deps, region);
  }, [input, deps, region, mode]);

  return (
    <div className="space-y-6">
      {/* Chọn chiều tính */}
      <div className="flex gap-2">
        {(['g2n', 'n2g'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {m === 'g2n' ? 'Gross → Net' : 'Net → Gross'}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            {mode === 'g2n' ? t('gross') : t('net')} (VND)
          </label>
          <input inputMode="numeric" value={parseInt(input.replace(/[^\d]/g, '') || '0').toLocaleString('vi-VN')}
            onChange={e => setInput(e.target.value.replace(/[^\d]/g, ''))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('dependents')}</label>
          <input type="number" min={0} max={20} value={deps}
            onChange={e => setDeps(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('region')}</label>
          <select value={region} onChange={e => setRegion(parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none">
            {['I', 'II', 'III', 'IV'].map((r, i) => <option key={r} value={i}>{t('region')} {r}</option>)}
          </select>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Kết quả lớn */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="text-sm text-gray-400 mb-1">
              {mode === 'g2n' ? t('net') : t('gross')}
            </div>
            <div className="font-display text-4xl font-bold text-indigo-600 tabular-nums">
              {fmt(mode === 'g2n' ? result.net : result.gross)} <span className="text-lg text-gray-400">₫</span>
            </div>
          </div>
          {/* Chi tiết */}
          <div className="px-6 py-4 text-sm space-y-2">
            {[
              [t('gross'), fmt(result.gross)],
              [`${t('bhxh')} (8%)`, `−${fmt(result.ins.bhxh)}`],
              [`${t('bhyt')} (1.5%)`, `−${fmt(result.ins.bhyt)}`],
              [`${t('bhtn')} (1%)`, `−${fmt(result.ins.bhtn)}`],
              [t('deduction'), fmt(DEDUCT_SELF + deps * DEDUCT_DEP)],
              [t('taxable'), fmt(result.taxable)],
              [t('tax'), `−${fmt(result.tax)}`],
              [t('net'), fmt(result.net)],
            ].map(([label, val], i, arr) => (
              <div key={i} className={`flex justify-between ${i === arr.length - 1 ? 'pt-2 border-t border-gray-100 font-semibold text-gray-900' : 'text-gray-600'}`}>
                <span>{label}</span>
                <span className="font-mono tabular-nums">{val} ₫</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">{t('note')}</p>
    </div>
  );
}
