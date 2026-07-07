'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function JsonTool() {
  const t = useTranslations('tools.json');
  const tc = useTranslations('tools.common');
  const [input, setInput] = useState('{"name":"dealeg","tools":20}');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function run(minify: boolean) {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, minify ? 0 : 2));
      setError('');
    } catch (e) {
      setError((e as Error).message);
      setOutput('');
    }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  return (
    <div className="max-w-3xl space-y-4">
      <textarea value={input} onChange={e => setInput(e.target.value)} rows={8} spellCheck={false}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y" />
      <div className="flex gap-2">
        <button onClick={() => run(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">{t('format')}</button>
        <button onClick={() => run(true)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">{t('minify')}</button>
      </div>
      {error && <p className="text-sm text-red-500 font-mono">✗ {error}</p>}
      {output && (
        <div className="relative">
          <button onClick={copy} className={`absolute top-2 right-2 text-xs px-3 py-1 rounded font-medium ${copied ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}>
            {copied ? '✓' : tc('copy')}
          </button>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono overflow-auto max-h-96">{output}</pre>
        </div>
      )}
    </div>
  );
}
