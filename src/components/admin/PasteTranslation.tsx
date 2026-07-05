'use client';

import { useState, useEffect } from 'react';

const LOCALES = [
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'zh', name: '中文 (Trung)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
  { code: 'es', name: 'Español (TBN)' },
  { code: 'pt', name: 'Português (BĐN)' },
  { code: 'fr', name: 'Français (Pháp)' },
  { code: 'de', name: 'Deutsch (Đức)' },
  { code: 'ar', name: 'العربية (Ả Rập)' },
  { code: 'ru', name: 'Русский (Nga)' },
  { code: 'ja', name: '日本語 (Nhật)' },
  { code: 'ko', name: '한국어 (Hàn)' },
];

interface Props {
  articleId: string;
  existingTranslations: { locale: string }[];  // ngôn ngữ đã dịch
}

export function PasteTranslation({ articleId, existingTranslations }: Props) {
  const [sourceBlock, setSourceBlock] = useState('');
  const [locale, setLocale] = useState('vi');
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<string[]>(existingTranslations.map(t => t.locale));

  // Lấy bài gốc (khối có nhãn) khi mở
  useEffect(() => {
    fetch(`/api/admin/articles/${articleId}/paste-translation`)
      .then(r => r.json())
      .then(d => { if (d.block) setSourceBlock(d.block); })
      .catch(() => {});
  }, [articleId]);

  async function copySource() {
    try {
      await navigator.clipboard.writeText(sourceBlock);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function save() {
    if (!pasted.trim()) return;
    setStatus('saving'); setMsg('');
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/paste-translation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, text: pasted }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg(`✓ Đã lưu bản dịch ${locale.toUpperCase()}`);
        setPasted('');
        if (!done.includes(locale)) setDone([...done, locale]);
        // Tự chuyển sang ngôn ngữ chưa dịch tiếp theo
        const next = LOCALES.find(l => !done.includes(l.code) && l.code !== locale);
        if (next) setLocale(next.code);
      } else {
        setStatus('error');
        setMsg(data.error ?? 'Lỗi khi lưu');
      }
    } catch {
      setStatus('error');
      setMsg('Không kết nối được server');
    }
  }

  const remaining = LOCALES.filter(l => !done.includes(l.code)).length;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">📋 Cách dịch bằng DeepL web (miễn phí, không giới hạn):</p>
        <ol className="list-decimal ml-5 space-y-1 text-blue-700">
          <li>Bấm <strong>"Copy bài gốc"</strong> bên dưới</li>
          <li>Mở <a href="https://www.deepl.com/translator" target="_blank" rel="noopener noreferrer" className="underline font-medium">deepl.com/translator</a>, dán vào, chọn ngôn ngữ đích</li>
          <li>Copy bản dịch, chọn đúng ngôn ngữ ở đây, dán vào ô "Bản dịch"</li>
          <li>Bấm <strong>Lưu</strong>. Giữ nguyên 3 dòng <code className="bg-blue-100 px-1 rounded">=====</code> khi dịch!</li>
        </ol>
      </div>

      {/* Tiến độ */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Đã dịch:</span>
        {LOCALES.map(l => (
          <span
            key={l.code}
            className={`text-xs px-2 py-1 rounded-full ${
              done.includes(l.code)
                ? 'bg-green-100 text-green-700 font-medium'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {done.includes(l.code) ? '✓ ' : ''}{l.code.toUpperCase()}
          </span>
        ))}
        <span className="text-sm text-gray-400 ml-2">
          {remaining > 0 ? `Còn ${remaining} ngôn ngữ` : '✓ Đủ 11 ngôn ngữ!'}
        </span>
      </div>

      {/* Bài gốc để copy */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Bài gốc (tiếng Anh) — copy khối này</label>
          <button
            onClick={copySource}
            className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? '✓ Đã copy!' : '📋 Copy bài gốc'}
          </button>
        </div>
        <textarea
          value={sourceBlock}
          readOnly
          rows={8}
          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 bg-gray-50 resize-none"
        />
      </div>

      {/* Chọn ngôn ngữ + paste */}
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Ngôn ngữ đích</label>
          <select
            value={locale}
            onChange={e => setLocale(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full sm:w-auto"
          >
            {LOCALES.map(l => (
              <option key={l.code} value={l.code}>
                {done.includes(l.code) ? '✓ ' : ''}{l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Bản dịch (paste từ DeepL vào đây)
          </label>
          <textarea
            value={pasted}
            onChange={e => setPasted(e.target.value)}
            rows={10}
            placeholder="Dán bản dịch từ DeepL vào đây... (giữ nguyên 3 dòng =====)"
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={status === 'saving' || !pasted.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            {status === 'saving' ? 'Đang lưu...' : `💾 Lưu bản dịch ${locale.toUpperCase()}`}
          </button>
          {msg && (
            <span className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {msg}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
