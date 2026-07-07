'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function ImageCompressTool() {
  const t = useTranslations('tools.imagecompress');
  const tc = useTranslations('tools.common');
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  const [result, setResult] = useState<{ url: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);

  async function process(f: File, q: number, fmt: string) {
    setBusy(true);
    const img = new Image();
    const url = URL.createObjectURL(f);
    await new Promise(res => { img.onload = res; img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    canvas.getContext('2d')!.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, fmt, q));
    if (blob) setResult({ url: URL.createObjectURL(blob), size: blob.size });
    setBusy(false);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); process(f, quality, format); }
  }

  const kb = (n: number) => (n / 1024).toFixed(0) + ' KB';
  const savedPct = file && result ? Math.max(0, Math.round((1 - result.size / file.size) * 100)) : 0;
  const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[format];

  return (
    <div className="max-w-xl space-y-5">
      <input type="file" accept="image/*" onChange={onFile}
        className="text-sm file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-sm file:font-medium hover:file:bg-indigo-700 file:cursor-pointer" />

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs text-gray-500 flex justify-between mb-1">
            <span>{t('quality')}</span><span>{Math.round(quality * 100)}%</span>
          </label>
          <input type="range" min={0.1} max={1} step={0.05} value={quality}
            onChange={e => { const q = parseFloat(e.target.value); setQuality(q); if (file) process(file, q, format); }}
            className="w-full accent-indigo-600" />
        </div>
        <select value={format}
          onChange={e => { const f = e.target.value as typeof format; setFormat(f); if (file) process(file, quality, f); }}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
          <option value="image/jpeg">JPG</option>
          <option value="image/webp">WebP</option>
          <option value="image/png">PNG</option>
        </select>
      </div>

      {file && result && (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-5">
          <div className="flex items-baseline gap-4 flex-wrap">
            <div>
              <div className="text-xs text-gray-400">{t('original')}</div>
              <div className="font-mono text-gray-600">{kb(file.size)}</div>
            </div>
            <span className="text-gray-300">→</span>
            <div>
              <div className="text-xs text-gray-400">{t('compressed')}</div>
              <div className="font-display text-2xl font-bold text-indigo-600">{kb(result.size)}</div>
            </div>
            {savedPct > 0 && (
              <span className="text-sm text-green-600 font-medium">−{savedPct}%</span>
            )}
          </div>
          <a href={result.url} download={`compressed.${ext}`}
            className="inline-block mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {tc('download')} ↓
          </a>
        </div>
      )}
      {busy && <p className="text-sm text-gray-400">...</p>}
    </div>
  );
}
