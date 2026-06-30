'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = ['DOMAIN','HOSTING','VPN','SECURITY','EMAIL','CDN','SSL','OTHER'] as const;

export interface VoucherFormData {
  code:          string;
  provider:      string;
  category:      string;
  discount:      string;
  discountValue: number;
  affiliateUrl:  string;
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
  affiliateUrl: '', expiresAt: '', isVerified: false, isActive: true,
  titleVi: '', descVi: '', titleEn: '', descEn: '',
};

interface Props {
  initial?: Partial<VoucherFormData>;
  voucherId?: string;   // nếu có → chế độ edit (PUT), không có → tạo mới (POST)
}

export function VoucherForm({ initial, voucherId }: Props) {
  const [form,    setForm]    = useState<VoucherFormData>({ ...EMPTY, ...initial });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const router = useRouter();

  function set(field: keyof VoucherFormData, value: string | boolean | number) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.code || !form.provider || !form.discount) {
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
            <input value={form.provider} onChange={e => set('provider', e.target.value)}
              placeholder="VD: Namecheap" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Danh mục *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className={inputCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Mô tả giảm giá * <span className="text-gray-400">(hiển thị trên card)</span></label>
            <input value={form.discount} onChange={e => set('discount', e.target.value)}
              placeholder="VD: -30% hoặc Miễn phí 3 tháng" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Giá trị % <span className="text-gray-400">(để sort, 0 nếu không phải %)</span></label>
            <input type="number" min={0} max={100}
              value={form.discountValue} onChange={e => set('discountValue', Number(e.target.value))}
              className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Affiliate URL</label>
            <input value={form.affiliateUrl} onChange={e => set('affiliateUrl', e.target.value)}
              placeholder="https://..." className={inputCls} />
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

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors">
          {loading ? 'Đang lưu...' : voucherId ? '💾 Cập nhật' : '➕ Tạo voucher'}
        </button>
        <button onClick={() => router.back()}
          className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2.5 rounded-lg text-sm transition-colors">
          Huỷ
        </button>
      </div>
    </div>
  );
}
