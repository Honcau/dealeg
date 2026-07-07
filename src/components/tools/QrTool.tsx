'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

export function QrTool() {
  const t = useTranslations('tools.qr');
  const tc = useTranslations('tools.common');
  const [tab, setTab] = useState<'wifi' | 'vcard'>('wifi');
  const [wifi, setWifi] = useState({ ssid: '', pass: '', sec: 'WPA', hidden: false });
  const [card, setCard] = useState({ name: '', phone: '', email: '', org: '' });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');
  const content = tab === 'wifi'
    ? (wifi.ssid ? `WIFI:T:${wifi.sec};S:${esc(wifi.ssid)};P:${esc(wifi.pass)};H:${wifi.hidden};;` : '')
    : (card.name ? `BEGIN:VCARD\nVERSION:3.0\nFN:${card.name}\n${card.phone ? `TEL:${card.phone}\n` : ''}${card.email ? `EMAIL:${card.email}\n` : ''}${card.org ? `ORG:${card.org}\n` : ''}END:VCARD` : '');

  useEffect(() => {
    if (!content || !canvasRef.current) return;
    import('qrcode').then(QR => {
      QR.toCanvas(canvasRef.current!, content, { width: 260, margin: 2 });
    }).catch(() => {});
  }, [content]);

  function download() {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.download = `${tab}-qr.png`;
    a.href = canvasRef.current.toDataURL('image/png');
    a.click();
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex gap-2">
        {(['wifi', 'vcard'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tb ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tb === 'wifi' ? 'WiFi QR' : 'vCard QR'}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {tab === 'wifi' ? (
            <>
              <div><label className="text-sm text-gray-600 block mb-1">{t('ssid')}</label>
                <input value={wifi.ssid} onChange={e => setWifi({ ...wifi, ssid: e.target.value })} className={inputCls} /></div>
              <div><label className="text-sm text-gray-600 block mb-1">{t('password')}</label>
                <input value={wifi.pass} onChange={e => setWifi({ ...wifi, pass: e.target.value })} className={inputCls} /></div>
              <div><label className="text-sm text-gray-600 block mb-1">{t('security')}</label>
                <select value={wifi.sec} onChange={e => setWifi({ ...wifi, sec: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white">
                  <option>WPA</option><option>WEP</option><option value="nopass">Open</option>
                </select></div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={wifi.hidden} onChange={e => setWifi({ ...wifi, hidden: e.target.checked })} className="accent-indigo-600" />
                {t('hidden')}
              </label>
            </>
          ) : (
            <>
              <div><label className="text-sm text-gray-600 block mb-1">{t('fullName')}</label>
                <input value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} className={inputCls} /></div>
              <div><label className="text-sm text-gray-600 block mb-1">{t('phone')}</label>
                <input value={card.phone} onChange={e => setCard({ ...card, phone: e.target.value })} className={inputCls} /></div>
              <div><label className="text-sm text-gray-600 block mb-1">Email</label>
                <input value={card.email} onChange={e => setCard({ ...card, email: e.target.value })} className={inputCls} /></div>
              <div><label className="text-sm text-gray-600 block mb-1">{t('company')}</label>
                <input value={card.org} onChange={e => setCard({ ...card, org: e.target.value })} className={inputCls} /></div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-6 min-h-[300px]">
          {content ? (
            <>
              <canvas ref={canvasRef} className="rounded-lg" />
              <button onClick={download} className="mt-4 text-sm text-indigo-600 font-medium hover:underline">
                {tc('download')} ↓
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center">{t('note')}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-400">{t('privacyNote')}</p>
    </div>
  );
}
