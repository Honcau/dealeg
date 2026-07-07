'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';

// Kích thước xuất tại 300 DPI: 3x4cm = 354×472px, 4x6cm = 472×709px
const SIZES = [
  { key: '3x4', w: 354, h: 472, label: '3×4 cm' },
  { key: '4x6', w: 472, h: 709, label: '4×6 cm' },
] as const;
const BGS = ['#ffffff', '#4a90d9'] as const; // trắng, xanh

export function IdPhotoTool() {
  const t = useTranslations('tools.idphoto');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [size, setSize] = useState(0);
  const [bg, setBg] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => { setImg(im); setZoom(1); setPos({ x: 0, y: 0 }); URL.revokeObjectURL(url); };
    im.src = url;
  }

  const draw = useCallback((canvas: HTMLCanvasElement, scale: number) => {
    const { w, h } = SIZES[size];
    canvas.width = w * scale; canvas.height = h * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = BGS[bg];
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!img) return;
    const base = Math.max(canvas.width / img.width, canvas.height / img.height) * zoom;
    const dw = img.width * base, dh = img.height * base;
    ctx.drawImage(img, (canvas.width - dw) / 2 + pos.x * scale, (canvas.height - dh) / 2 + pos.y * scale, dw, dh);
  }, [img, size, bg, zoom, pos]);

  // Vẽ preview mỗi render
  if (canvasRef.current) draw(canvasRef.current, 0.6);

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setPos({
      x: dragRef.current.origX + (e.clientX - dragRef.current.startX) / 0.6,
      y: dragRef.current.origY + (e.clientY - dragRef.current.startY) / 0.6,
    });
  }
  function onPointerUp() { dragRef.current = null; }

  function download() {
    const c = document.createElement('canvas');
    draw(c, 1);
    const a = document.createElement('a');
    a.download = `id-photo-${SIZES[size].key}.jpg`;
    a.href = c.toDataURL('image/jpeg', 0.95);
    a.click();
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <input type="file" accept="image/*" onChange={onFile}
          className="text-sm file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-sm file:font-medium hover:file:bg-indigo-700 file:cursor-pointer" />
        <div className="flex gap-2">
          {SIZES.map((s, i) => (
            <button key={s.key} onClick={() => setSize(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${size === i ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {BGS.map((c, i) => (
            <button key={c} onClick={() => setBg(i)} title={i === 0 ? t('bgWhite') : t('bgBlue')}
              className={`w-7 h-7 rounded-full border-2 ${bg === i ? 'border-indigo-600' : 'border-gray-300'}`}
              style={{ background: c }} />
          ))}
        </div>
      </div>

      {img ? (
        <>
          <div className="flex flex-col items-center gap-4">
            <canvas ref={canvasRef}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
              className="border border-gray-300 rounded-lg cursor-move touch-none"
              style={{ width: SIZES[size].w * 0.6, height: SIZES[size].h * 0.6 }} />
            <div className="w-full max-w-xs">
              <label className="text-xs text-gray-500 flex justify-between mb-1">
                <span>{t('zoom')}</span><span>{Math.round(zoom * 100)}%</span>
              </label>
              <input type="range" min={1} max={3} step={0.01} value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
            </div>
            <button onClick={download}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
              {t('download')} ({SIZES[size].label}, 300 DPI)
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">{t('dragHint')}</p>
        </>
      ) : (
        <p className="text-sm text-gray-400">{t('note')}</p>
      )}
    </div>
  );
}
