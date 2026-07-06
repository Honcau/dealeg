'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

const SETS = {
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lower: 'abcdefghijkmnpqrstuvwxyz',
  digits: '23456789',
  symbols: '!@#$%^&*-_=+?',
};

export function PasswordTool() {
  const t = useTranslations('tools.password');
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, digits: true, symbols: true });
  const [pwd, setPwd] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const pool = (Object.keys(opts) as (keyof typeof opts)[])
      .filter(k => opts[k]).map(k => SETS[k]).join('');
    if (!pool) { setPwd(''); return; }
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    setPwd(Array.from(arr, x => pool[x % pool.length]).join(''));
    setCopied(false);
  }, [length, opts]);

  useEffect(() => { generate(); }, [generate]);

  async function copy() {
    try { await navigator.clipboard.writeText(pwd); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  const variety = Object.values(opts).filter(Boolean).length;
  const strength = length >= 16 && variety >= 3 ? 'strong' : length >= 12 && variety >= 2 ? 'medium' : 'weak';
  const strengthColor = { strong: 'text-green-600', medium: 'text-amber-500', weak: 'text-red-500' }[strength];

  return (
    <div className="max-w-xl space-y-6">
      {/* Kết quả */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="font-mono text-lg break-all text-gray-900 min-h-[28px]">{pwd || '—'}</div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className={`text-sm font-medium ${strengthColor}`}>{t(strength)}</span>
          <div className="flex gap-2">
            <button onClick={generate}
              className="text-sm px-4 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors">
              ↻ {t('generate')}
            </button>
            <button onClick={copy} disabled={!pwd}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}>
              {copied ? '✓ ' + t('copied') : t('copy')}
            </button>
          </div>
        </div>
      </div>

      {/* Tùy chọn */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 flex justify-between mb-2">
            <span>{t('length')}</span>
            <span className="font-mono text-indigo-600">{length}</span>
          </label>
          <input type="range" min={8} max={64} value={length}
            onChange={e => setLength(parseInt(e.target.value))}
            className="w-full accent-indigo-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(SETS) as (keyof typeof SETS)[]).map(k => (
            <label key={k} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={opts[k]}
                onChange={e => setOpts({ ...opts, [k]: e.target.checked })}
                className="accent-indigo-600 w-4 h-4" />
              {t(k)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
