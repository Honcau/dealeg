'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['DOMAIN','HOSTING','VPS','VPN','SECURITY','EMAIL','CDN','SSL','AITOOL','OTHER'] as const;

export interface VoucherFormData {
  code:          string;
  provider:      string;
  category:      string;
  discount:      string;
  discountValue: number;
  affiliateUrl:  string;
  sourceUrl:     string;
  expiresAt:     string;
  isVerified:    boolean;
  isActive:      boolean;
  titleVi:       string;
  descVi:        string;
  titleEn:       string;
  descEn:        string;
}

const EMPTY: VoucherFormData = {
  code: '', provider: '', category: 'DOMAIN', discount: '', discountValue: 0,
  affiliateUrl: '', sourceUrl: '', expiresAt: '', isVerified: false, isActive: true,
  titleVi: '', descVi: '', titleEn: '', descEn: '',
};

interface Props {
  initial?: Partial<VoucherFormData>;
  voucherId?: string;   // nếu có → chế độ edit (PUT), không có → tạo mới (POST)
}

export function VoucherForm({ initial, voucherId }: Props) {
  const [translating, setTranslating] = useState(false);
  const [trMsg, setTrMsg] = useState('');
  const [form,    setForm]    = useState<VoucherFormData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [providers, setProviders] = useState<{ name: string }[]>([]);
  const router = useRouter();

  // Nạp danh sách provider để chọn (thay vì gõ tay)
  useEffect(() => {
    fetch('/api/admin/providers')
      .then(r => (r.ok ? r.json() : []))
      .then((rows: { name: string }[]) => setProviders(rows))
      .catch(() => {});
  }, []);

  function set(field: keyof VoucherFormData, value: string | boolean | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.code || !form.provider) {
      setError('Vui lòng điền các trường bắt buộc (*)');
      return;
    }
    setLoading(true);
    setError('');

    const url    = voucherId ? `/api/admin/vouchers/${voucherId}` : '/api/admin/vouchers';
    const method = voucherId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push('/admin/vouchers');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error?.fieldErrors ? JSON.stringify(data.error.fieldErrors) : 'Có lỗi xảy ra');
      setLoading(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  async function handleTranslate() {
    if (!voucherId) return;
    setTranslating(true); setTrMsg('');
    try {
      const res = await fetch(`/api/admin/vouchers/${voucherId}/translate`, { method: 'POST' });
      const data = await res.json();
      setTrMsg(data.summary ?? data.error ?? 'Xong');
    } catch {
      setTrMsg('Lỗi khi dịch');
    }
    setTranslating(false);
  }

  return (
    <div className="space-y-8">

      {/* ── Thông tin cơ bản ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Thông tin cơ bản
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label className={labelCls}>Mã voucher *</label>
            <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
              placeholder="VD: CHEAP2026" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Nhà cung cấp *</label>
            <select value={form.provider} onChange={e => set('provider', e.target.value)} className={inputCls}>
              <option value="">— chọn provider —</option>
              {/* Giữ giá trị cũ khi sửa voucher nếu provider chưa có trong danh sách */}
              {form.provider && !providers.some(p => p.name === form.provider) && (
                <option value={form.provider}>{form.provider}</option>
              )}
              {providers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <a href="/admin/providers" target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
              + Tạo provider mới
            </a>
          </div>

          <div>
            <label className={labelCls}>Danh mục *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className={inputCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Giá trị % * <span className="text-gray-400">(hiển thị trên card & để sort, 0 nếu không phải %)</span></label>
            <input type="number" min={0} max={100}
              value={form.discountValue} onChange={e => set('discountValue', Number(e.target.value))}
              className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>
              Link affiliate <span className="text-indigo-500">(link kiếm tiền — dùng khi bấm "Nhận mã")</span>
            </label>
            <input value={form.affiliateUrl} onChange={e => set('affiliateUrl', e.target.value)}
              placeholder="https://provider.com/?ref=your-id" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">
              Link có mã affiliate của bạn. User bấm "Nhận mã" sẽ được đưa qua link này.
              Để trống nếu chưa có (nút sẽ chỉ copy code, không mở link).
            </p>
          </div>

          <div>
            <label className={labelCls}>
              Link gốc <span className="text-gray-400">(tùy chọn — trang provider không có affiliate)</span>
            </label>
            <input value={form.sourceUrl} onChange={e => set('sourceUrl', e.target.value)}
              placeholder="https://provider.com" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">
              Link trang chính thức của provider. Dùng để tham khảo, hoặc fallback nếu chưa có link affiliate.
            </p>
          </div>

          <div>
            <label className={labelCls}>Ngày hết hạn <span className="text-gray-400">(để trống = không giới hạn)</span></label>
            <input type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)}
              className={inputCls} />
          </div>

          <div className="flex items-center gap-6 pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.isVerified}
                onChange={e => set('isVerified', e.target.checked)}
                className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm text-gray-700">Đã xác minh</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.isActive}
                onChange={e => set('isActive', e.target.checked)}
                className="w-4 h-4 accent-indigo-600" />
              <span className="text-sm text-gray-700">Đang active</span>
            </label>
          </div>
        </div>
      </section>

      {/* ── Bản dịch ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Nội dung hiển thị
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-indigo-600">🇻🇳 Tiếng Việt</p>
            <div>
              <label className={labelCls}>Tiêu đề</label>
              <input value={form.titleVi} onChange={e => set('titleVi', e.target.value)}
                placeholder="VD: Giảm 30% tên miền .com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mô tả chi tiết</label>
              <textarea value={form.descVi} onChange={e => set('descVi', e.target.value)}
                rows={3} placeholder="Điều kiện, hạn mức..." className={`${inputCls} resize-none`} />
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold text-indigo-600">🇺🇸 English</p>
            <div>
              <label className={labelCls}>Title</label>
              <input value={form.titleEn} onChange={e => set('titleEn', e.target.value)}
                placeholder="E.g. 30% off first .com domain" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={form.descEn} onChange={e => set('descEn', e.target.value)}
                rows={3} placeholder="Conditions, limits..." className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Actions ── */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          ❌ {error}
        </p>
      )}

      <div className="flex gap-3 items-center flex-wrap">
        <button onClick={handleSave} disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
          {loading ? 'Đang lưu...' : voucherId ? '💾 Cập nhật' : '➕ Tạo voucher'}
        </button>
        <button onClick={() => router.back()}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
          Huỷ
        </button>

        {/* Nút dịch — TÙY CHỌN, chỉ hiện khi sửa voucher đã có */}
        {voucherId && (
          <button onClick={handleTranslate} disabled={translating}
            className="ml-auto bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
            {translating ? 'Đang dịch...' : '🌐 Dịch mô tả sang 11 ngôn ngữ (DeepL)'}
          </button>
        )}
        {trMsg && <span className="text-xs text-gray-500">{trMsg}</span>}
      </div>

      {voucherId && (
        <p className="text-xs text-gray-400">
          Mẹo: mô tả voucher không bắt buộc dịch — % giảm giá + tên provider đã đủ thông tin cho mọi ngôn ngữ.
          Chỉ dịch nếu mô tả dài và quan trọng. Dịch tốn quota DeepL — hoặc dùng "Dịch Paste" bên dưới (miễn phí).
        </p>
      )}
    </div>
  );
}
