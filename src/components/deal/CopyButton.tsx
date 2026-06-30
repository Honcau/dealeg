'use client';

import { useState } from 'react';

interface Props { code: string; affiliateUrl: string }

export function CopyButton({ code, affiliateUrl }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-3">
      <button onClick={handleCopy}
        className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed transition-all ${
          copied ? 'border-green-400 bg-green-50' : 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50'
        }`}>
        <span className="font-mono font-bold text-lg tracking-widest text-gray-800">{code}</span>
        <span className={`text-sm font-semibold ${copied ? 'text-green-600' : 'text-indigo-500'}`}>
          {copied ? '✓ Đã chép' : 'Sao chép'}
        </span>
      </button>
      <a href={affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
        Đến trang →
      </a>
    </div>
  );
}
