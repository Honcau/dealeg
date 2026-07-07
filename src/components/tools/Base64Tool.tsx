'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const enc = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const dec = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));

export function Base64Tool() {
  const t = useTranslations('tools.base64');
  const tc = useTranslations('tools.common');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  let output = '', err = false;
  try { output = mode === 'encode' ? enc(input) : input ? dec(input.trim()) : ''; }
  catch { err = true; }

  async function copy() {
    try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex gap-2">
        {(['encode', 'decode'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {m === 'encode' ? t('encode') : t('decode')}
          </button>
        ))}
      </div>
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={5}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
      <div className="relative">
        {output && (
          <button onClick={copy} className={`absolute top-2 right-2 text-xs px-3 py-1 rounded font-medium ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}>
            {copied ? '✓' : tc('copy')}
          </button>
        )}
        <textarea value={err ? '✗ Invalid Base64' : output} readOnly rows={5}
          className={`w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono resize-y ${err ? 'text-red-500' : ''}`} />
      </div>
    </div>
  );
}
