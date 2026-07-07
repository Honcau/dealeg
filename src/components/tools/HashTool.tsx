'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const;

export function HashTool() {
  const t = useTranslations('tools.hash');
  const tc = useTranslations('tools.common');
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState<typeof ALGOS[number]>('SHA-256');
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input) { setHash(''); return; }
    crypto.subtle.digest(algo, new TextEncoder().encode(input)).then(buf => {
      setHash(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
    });
  }, [input, algo]);

  async function copy() {
    try { await navigator.clipboard.writeText(hash); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex gap-2 flex-wrap">
        {ALGOS.map(a => (
          <button key={a} onClick={() => setAlgo(a)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${algo === a ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {a}
          </button>
        ))}
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={5}
        placeholder={t('input')}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
      {hash && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">{algo}</span>
            <button onClick={copy} className={`text-xs px-3 py-1 rounded font-medium ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}>
              {copied ? '✓' : tc('copy')}
            </button>
          </div>
          <div className="font-mono text-xs text-gray-800 break-all">{hash}</div>
        </div>
      )}
    </div>
  );
}
