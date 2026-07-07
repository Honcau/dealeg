'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function TextCounterTool() {
  const t = useTranslations('tools.textcounter');
  const [text, setText] = useState('');

  const stats = {
    chars: text.length,
    noSpaces: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split('\n').length : 0,
  };

  const transforms: [string, (s: string) => string][] = [
    [t('upper'), s => s.toUpperCase()],
    [t('lower'), s => s.toLowerCase()],
    [t('titleCase'), s => s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())],
    [t('sentenceCase'), s => s.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase())],
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={8}
        placeholder="..."
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[[t('words'), stats.words], [t('characters'), stats.chars], [t('noSpaces'), stats.noSpaces], [t('lines'), stats.lines]].map(([label, val]) => (
          <div key={label as string} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
            <div className="font-display text-2xl font-bold text-indigo-600 tabular-nums">{val}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {transforms.map(([label, fn]) => (
          <button key={label} onClick={() => setText(fn(text))}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
