'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Ngân hàng phổ biến VN — mã BIN theo chuẩn Napas (dùng cho img.vietqr.io)
const BANKS = [
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970426', name: 'MSB' },
  { bin: '970448', name: 'OCB' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970449', name: 'LPBank' },
  { bin: '970428', name: 'Nam A Bank' },
  { bin: '963388', name: 'Timo' },
];

export function VietQRTool() {
  const t = useTranslations('tools.vietqr');
  const [bin, setBin] = useState(BANKS[0].bin);
  const [account, setAccount] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const valid = account.trim().length >= 4;
  const qrUrl = valid
    ? `https://img.vietqr.io/image/${bin}-${account.trim()}-compact2.png?` +
      new URLSearchParams({
        ...(amount ? { amount: amount.replace(/[^\d]/g, '') } : {}),
        ...(message ? { addInfo: message } : {}),
        ...(name ? { accountName: name } : {}),
      }).toString()
    : null;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('bank')}</label>
          <select value={bin} onChange={e => setBin(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none">
            {BANKS.map(b => <option key={b.bin} value={b.bin}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('account')}</label>
          <input value={account} onChange={e => setAccount(e.target.value.replace(/[^\dA-Za-z]/g, ''))}
            placeholder="0123456789"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('accountName')}</label>
          <input value={name} onChange={e => setName(e.target.value.toUpperCase())}
            placeholder="NGUYEN VAN A"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('amount')} (VND)</label>
          <input inputMode="numeric"
            value={amount ? parseInt(amount.replace(/[^\d]/g, '') || '0').toLocaleString('vi-VN') : ''}
            onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="100.000"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('message')}</label>
          <input value={message} onChange={e => setMessage(e.target.value)} maxLength={50}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* QR kết quả */}
      <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-6 min-h-[320px]">
        {qrUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="VietQR" className="w-full max-w-[280px] rounded-lg" />
            <a href={qrUrl} download="vietqr.png" target="_blank" rel="noopener noreferrer"
              className="mt-4 text-sm text-indigo-600 font-medium hover:underline">
              {t('download')} ↓
            </a>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center">{t('note')}</p>
        )}
      </div>
    </div>
  );
}
