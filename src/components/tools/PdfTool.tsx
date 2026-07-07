'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function PdfTool() {
  const t = useTranslations('tools.pdf');
  const tc = useTranslations('tools.common');
  const [tab, setTab] = useState<'merge' | 'split'>('merge');
  const [files, setFiles] = useState<File[]>([]);
  const [range, setRange] = useState('1-3');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function merge() {
    if (files.length < 2) return;
    setBusy(true); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const out = await PDFDocument.create();
      for (const f of files) {
        const src = await PDFDocument.load(await f.arrayBuffer());
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(p => out.addPage(p));
      }
      downloadBytes(await out.save(), 'merged.pdf');
    } catch { setError(t('errorGeneric')); }
    setBusy(false);
  }

  async function split() {
    if (files.length !== 1) return;
    setBusy(true); setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const src = await PDFDocument.load(await files[0].arrayBuffer());
      const total = src.getPageCount();
      // Parse "1-3,5" → chỉ số trang (0-based)
      const indices: number[] = [];
      for (const part of range.split(',')) {
        const [a, b] = part.split('-').map(x => parseInt(x.trim()));
        if (isNaN(a)) continue;
        const end = isNaN(b) ? a : b;
        for (let i = a; i <= Math.min(end, total); i++) if (i >= 1) indices.push(i - 1);
      }
      if (!indices.length) { setError(t('errorRange')); setBusy(false); return; }
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach(p => out.addPage(p));
      downloadBytes(await out.save(), 'split.pdf');
    } catch { setError(t('errorGeneric')); }
    setBusy(false);
  }

  function downloadBytes(bytes: Uint8Array, name: string) {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex gap-2">
        {(['merge', 'split'] as const).map(tb => (
          <button key={tb} onClick={() => { setTab(tb); setFiles([]); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tb ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tb === 'merge' ? t('tabMerge') : t('tabSplit')}
          </button>
        ))}
      </div>

      <input type="file" accept=".pdf" multiple={tab === 'merge'}
        onChange={e => setFiles(Array.from(e.target.files ?? []))}
        className="text-sm file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-sm file:font-medium hover:file:bg-indigo-700 file:cursor-pointer" />

      {files.length > 0 && (
        <ul className="text-sm text-gray-600 space-y-1">
          {files.map((f, i) => <li key={i} className="font-mono text-xs">📄 {f.name}</li>)}
        </ul>
      )}

      {tab === 'split' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('pageRange')}</label>
          <input value={range} onChange={e => setRange(e.target.value)} placeholder="1-3,5"
            className="w-40 px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      )}

      <button onClick={tab === 'merge' ? merge : split}
        disabled={busy || (tab === 'merge' ? files.length < 2 : files.length !== 1)}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
        {busy ? '...' : tab === 'merge' ? t('merge') : t('split')}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-gray-400">{t('note')}</p>
    </div>
  );
}
