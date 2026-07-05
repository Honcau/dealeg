'use client';

import { useState, useEffect, useCallback } from 'react';

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
  existingTranslations: { locale: string }[];
}

export function PasteTranslation({ articleId, existingTranslations }: Props) {
  const [chunks, setChunks] = useState<string[]>([]);
  const [totalChars, setTotalChars] = useState(0);
  const [locale, setLocale] = useState('vi');
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [copiedChunk, setCopiedChunk] = useState<number | null>(null);
  const [done, setDone] = useState<string[]>(existingTranslations.map(t => t.locale));

  // Key lưu nháp: theo bài + ngôn ngữ
  const draftKey = useCallback((loc: string) => `dealeg_draft_${articleId}_${loc}`, [articleId]);

  // Lấy bài gốc (đã chia đoạn) khi mở
  useEffect(() => {
    fetch(`/api/admin/articles/${articleId}/paste-translation`)
      .then(r => r.json())
      .then(d => {
        if (d.chunks) { setChunks(d.chunks); setTotalChars(d.totalChars); }
      })
      .catch(() => {});
  }, [articleId]);

  // Khi đổi ngôn ngữ → khôi phục nháp đã lưu (nếu có)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey(locale));
      setPasted(saved ?? '');
    } catch {
      setPasted('');
    }
  }, [locale, draftKey]);

  // Tự lưu nháp mỗi khi gõ (debounce nhẹ)
  useEffect(() => {
    if (!pasted) return;
    const timer = setTimeout(() => {
      try { localStorage.setItem(draftKey(locale), pasted); } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [pasted, locale, draftKey]);

  async function copyChunk(idx: number) {
    try {
      await navigator.clipboard.writeText(chunks[idx]);
      setCopiedChunk(idx);
      setTimeout(() => setCopiedChunk(null), 2000);
    } catch {}
  }

  // Thêm phần dịch vào ô ghép (nối tiếp)
  function appendToPasted(text: string) {
    setPasted(prev => prev ? prev + '\n\n' + text : text);
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
        // Xóa nháp sau khi lưu thành công
        try { localStorage.removeItem(draftKey(locale)); } catch {}
        setPasted('');
        if (!done.includes(locale)) setDone([...done, locale]);
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

  function clearDraft() {
    if (!confirm('Xóa nội dung đang nhập cho ngôn ngữ này?')) return;
    try { localStorage.removeItem(draftKey(locale)); } catch {}
    setPasted('');
  }

  const remaining = LOCALES.filter(l => !done.includes(l.code)).length;
  const multiChunk = chunks.length > 1;
  const hasMarks = (pasted.match(/=====/g) ?? []).length >= 3;

  return (
    <div className="space-y-6">
      {/* Hướng dẫn */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">📋 Dịch bằng DeepL web (miễn phí):</p>
        {multiChunk ? (
          <ol className="list-decimal ml-5 space-y-1 text-blue-700">
            <li>Bài này dài <strong>{totalChars.toLocaleString()} ký tự</strong> → chia làm <strong>{chunks.length} phần</strong> (mỗi phần dưới 5000 ký tự)</li>
            <li>Copy <strong>từng phần</strong>, dịch trên DeepL, bấm <strong>"+ Thêm vào bản dịch"</strong> để ghép dần</li>
            <li>Khi ghép đủ {chunks.length} phần, bấm <strong>Lưu</strong></li>
            <li><strong>Quan trọng:</strong> giữ nguyên 3 dòng <code className="bg-blue-100 px-1 rounded">=====</code>. Nội dung tự lưu nháp, không sợ mất.</li>
          </ol>
        ) : (
          <ol className="list-decimal ml-5 space-y-1 text-blue-700">
            <li>Copy bài gốc, dịch trên <a href="https://www.deepl.com/translator" target="_blank" rel="noopener noreferrer" className="underline font-medium">DeepL</a></li>
            <li>Paste bản dịch vào ô dưới, giữ nguyên 3 dòng <code className="bg-blue-100 px-1 rounded">=====</code></li>
            <li>Bấm Lưu. Nội dung tự lưu nháp.</li>
          </ol>
        )}
      </div>

      {/* Tiến độ ngôn ngữ */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Đã dịch:</span>
        {LOCALES.map(l => (
          <span key={l.code}
            className={`text-xs px-2 py-1 rounded-full ${
              done.includes(l.code) ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-400'
            }`}>
            {done.includes(l.code) ? '✓ ' : ''}{l.code.toUpperCase()}
          </span>
        ))}
        <span className="text-sm text-gray-400 ml-2">
          {remaining > 0 ? `Còn ${remaining}` : '✓ Đủ 11!'}
        </span>
      </div>

      {/* Chọn ngôn ngữ */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Ngôn ngữ đang dịch</label>
        <select value={locale} onChange={e => setLocale(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full sm:w-auto">
          {LOCALES.map(l => (
            <option key={l.code} value={l.code}>
              {done.includes(l.code) ? '✓ ' : ''}{l.name}
            </option>
          ))}
        </select>
        {(() => {
          try {
            const hasDraft = localStorage.getItem(draftKey(locale));
            return hasDraft ? <span className="text-xs text-amber-600 ml-3">● Có nháp đang lưu</span> : null;
          } catch { return null; }
        })()}
      </div>

      {/* Các phần bài gốc để copy */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Bài gốc {multiChunk ? `(${chunks.length} phần — copy & dịch từng phần)` : '(copy & dịch)'}
        </label>
        <div className="space-y-3">
          {chunks.map((chunk, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-gray-200">
                <span className="text-xs font-medium text-gray-500">
                  {multiChunk ? `Phần ${idx + 1}/${chunks.length}` : 'Toàn bài'} · {chunk.length.toLocaleString()} ký tự
                </span>
                <div className="flex gap-2">
                  <button onClick={() => copyChunk(idx)}
                    className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                      copiedChunk === idx ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}>
                    {copiedChunk === idx ? '✓ Đã copy' : '📋 Copy'}
                  </button>
                </div>
              </div>
              <textarea value={chunk} readOnly rows={4}
                className="w-full px-3 py-2 text-xs font-mono bg-white resize-none border-0 focus:outline-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Ô ghép bản dịch */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Bản dịch {locale.toUpperCase()} {multiChunk && '(ghép các phần vào đây)'}
          </label>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${hasMarks ? 'text-green-600' : 'text-amber-500'}`}>
              {hasMarks ? '✓ đủ 3 nhãn =====' : `⚠ cần 3 nhãn ===== (đang có ${(pasted.match(/=====/g) ?? []).length})`}
            </span>
            {pasted && (
              <button onClick={clearDraft} className="text-xs text-red-400 hover:text-red-600">Xóa</button>
            )}
          </div>
        </div>

        {multiChunk && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Dán phần dịch rồi bấm:</span>
            <QuickAppend onAppend={appendToPasted} />
          </div>
        )}

        <textarea value={pasted} onChange={e => setPasted(e.target.value)} rows={12}
          placeholder={`Dán bản dịch ${locale.toUpperCase()} vào đây...${multiChunk ? '\n\nBài dài chia nhiều phần — dùng nút "+ Thêm" ở trên để ghép từng phần, hoặc dán trực tiếp.' : ''}\n\nGiữ nguyên 3 dòng ===== TITLE/EXCERPT/CONTENT =====`}
          className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y" />
        <p className="text-xs text-gray-400 mt-1">
          {pasted.length.toLocaleString()} ký tự · tự lưu nháp khi gõ
        </p>
      </div>

      {/* Nút lưu */}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={status === 'saving' || !pasted.trim() || !hasMarks}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
          {status === 'saving' ? 'Đang lưu...' : `💾 Lưu bản dịch ${locale.toUpperCase()}`}
        </button>
        {msg && (
          <span className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>{msg}</span>
        )}
      </div>
    </div>
  );
}

/** Nút phụ: dán từ clipboard rồi thêm vào ô ghép */
function QuickAppend({ onAppend }: { onAppend: (text: string) => void }) {
  async function handleClick() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) onAppend(text.trim());
    } catch {
      alert('Không đọc được clipboard. Hãy dán tay (Ctrl+V) vào ô bên dưới.');
    }
  }
  return (
    <button onClick={handleClick}
      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-medium transition-colors">
      + Thêm phần đã copy vào bản dịch
    </button>
  );
}
