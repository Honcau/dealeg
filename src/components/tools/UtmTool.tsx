'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function UtmTool() {
  const t = useTranslations('tools.utm');
  const tc = useTranslations('tools.common');
  const [url, setUrl] = useState('https://');
  const [p, setP] = useState({ source: '', medium: '', campaign: '', term: '', content: '' });
  const [copied, setCopied] = useState(false);

  const params = new URLSearchParams();
  (Object.keys(p) as (keyof typeof p)[]).forEach(k => { if (p[k].trim()) params.set(`utm_${k}`, p[k].trim()); });
  const result = params.toString() ? `${url}${url.includes('?') ? '&' : '?'}${params.toString()}` : url;

  async function copy() {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const fields: (keyof typeof p)[] = ['source', 'medium', 'campaign', 'term', 'content'];
  const placeholders = { source: 'facebook', medium: 'cpc', campaign: 'summer_sale', term: 'vps+hosting', content: 'banner_a' };

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">URL</label>
        <input value={url} onChange={e => setUrl(e.target.value)} className={inputCls} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map(k => (
          <div key={k}>
            <label className="text-xs text-gray-500 block mb-1 font-mono">utm_{k}</label>
            <input value={p[k]} onChange={e => setP({ ...p, [k]: e.target.value })}
              placeholder={placeholders[k]} className={inputCls} />
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">{tc('result')}</span>
          <button onClick={copy}
            className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}>
            {copied ? '✓ ' + tc('copied') : tc('copy')}
          </button>
        </div>
        <div className="font-mono text-sm text-gray-800 break-all">{result}</div>
      </div>
    </div>
  );
}
