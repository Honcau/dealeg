'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { classifyVoucherLink, type LinkState } from '@/lib/affiliate';

interface Provider { id: string; name: string; affiliateUrl: string | null }
interface Voucher  { id: string; code: string; provider: string; affiliateUrl: string | null; sourceUrl: string | null; isActive: boolean }

const norm = (s: string) => s.trim().toLowerCase();

const STATE_UI: Record<LinkState, { label: string; cls: string }> = {
  missing:   { label: 'chưa có link',    cls: 'bg-amber-100 text-amber-800' },
  same:      { label: 'trùng link sẽ áp', cls: 'bg-gray-100 text-gray-500' },
  different: { label: 'khác link sẽ áp',  cls: 'bg-blue-100 text-blue-700' },
};

export default function AffiliateLinksPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [vouchers,  setVouchers]  = useState<Voucher[]>([]);
  const [providerName, setProviderName] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [picked,   setPicked]   = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');

  // Nạp provider + voucher (tái dùng API sẵn có, không thêm endpoint đọc)
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/providers').then(r => r.json()),
      fetch('/api/admin/vouchers').then(r => r.json()),
    ]).then(([ps, vs]) => {
      setProviders(ps); setVouchers(vs);
      // Vào thẳng từ trang Providers: /admin/affiliate-links?provider=<tên>
      const q = new URLSearchParams(window.location.search).get('provider');
      const first = (q && ps.find((p: Provider) => norm(p.name) === norm(q))) || ps[0];
      if (first) { setProviderName(first.name); setApplyUrl(first.affiliateUrl ?? ''); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const provider = providers.find(p => p.name === providerName);
  const rows = useMemo(
    () => vouchers.filter(v => norm(v.provider) === norm(providerName)),
    [vouchers, providerName],
  );
  const stateOf = useCallback((v: Voucher) => classifyVoucherLink(v, applyUrl), [applyUrl]);

  // Đổi provider → nạp lại link mặc định của nó, bỏ hết lựa chọn cũ
  function pickProvider(name: string) {
    setProviderName(name);
    setApplyUrl(providers.find(p => p.name === name)?.affiliateUrl ?? '');
    setPicked(new Set()); setMsg('');
  }

  // AN TOÀN: chỉ tự tick voucher CHƯA có link. Voucher đang có link khác (rất có thể là
  // deep-link cố ý) không bao giờ tự tick — phải tự tay chọn thì mới bị đè.
  const selectMissing = () => setPicked(new Set(rows.filter(v => stateOf(v) === 'missing').map(v => v.id)));
  const selectAll     = () => setPicked(new Set(rows.map(v => v.id)));
  const selectNone    = () => setPicked(new Set());

  // Tick lại mặc định khi đổi provider hoặc khi nạp xong dữ liệu.
  // CỐ Ý không phụ thuộc applyUrl: đang gõ sửa link mà ô tick tự nhảy thì rất khó chịu.
  useEffect(() => { selectMissing(); }, [providerName, rows.length]);   // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: string) {
    setPicked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function apply() {
    const ids = [...picked];
    if (ids.length === 0) return;
    const overwriting = rows.filter(v => picked.has(v.id) && stateOf(v) === 'different').length;
    const warn = overwriting > 0
      ? `\n\n⚠ Trong đó có ${overwriting} voucher ĐANG dùng link khác (có thể là deep-link riêng) sẽ bị ghi đè.`
      : '';
    if (!confirm(`Áp link này cho ${ids.length} voucher của "${providerName}"?${warn}`)) return;

    setSaving(true); setMsg('');
    const res = await fetch('/api/admin/vouchers/bulk-affiliate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, affiliateUrl: applyUrl }),
    });
    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setVouchers(prev => prev.map(v => (picked.has(v.id) ? { ...v, affiliateUrl: applyUrl } : v)));
      setPicked(new Set());
      setMsg(`✅ Đã cập nhật ${data.updated} voucher`);
    } else {
      setMsg('✗ ' + (data.error?.fieldErrors?.affiliateUrl?.[0] ?? 'Link không hợp lệ hoặc có lỗi'));
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Đang tải...</div>;

  const counts = {
    missing:   rows.filter(v => stateOf(v) === 'missing').length,
    same:      rows.filter(v => stateOf(v) === 'same').length,
    different: rows.filter(v => stateOf(v) === 'different').length,
  };
  const urlOk = /^https?:\/\/.+/i.test(applyUrl.trim());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Link affiliate</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Đối chiếu link của từng voucher với link sắp áp, rồi cập nhật 1 / nhiều / tất cả.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
            <select value={providerName} onChange={e => pickProvider(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Link sẽ áp {provider?.affiliateUrl && <span className="text-gray-400">(mặc định của provider)</span>}
            </label>
            <input value={applyUrl} onChange={e => { setApplyUrl(e.target.value); setMsg(''); }}
              placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-gray-400 mt-1">
              Sửa ở đây chỉ áp cho voucher được chọn — KHÔNG đổi link mặc định của provider
              (đổi mặc định thì vào <Link href="/admin/providers" className="text-indigo-600 hover:underline">Providers</Link>).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-sm">
          <span className="text-gray-500">
            {rows.length} voucher · <span className="text-amber-600 font-medium">{counts.missing} chưa có link</span>
            {' · '}{counts.same} trùng · <span className="text-blue-600">{counts.different} khác</span>
          </span>
          <span className="text-gray-300">|</span>
          <button onClick={selectMissing} className="text-indigo-600 hover:underline">Chỉ chọn chưa có link</button>
          <button onClick={selectAll}     className="text-indigo-600 hover:underline">Chọn tất cả</button>
          <button onClick={selectNone}    className="text-gray-500 hover:underline">Bỏ chọn</button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={apply} disabled={saving || picked.size === 0 || !urlOk}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {saving ? 'Đang cập nhật...' : `Áp link cho ${picked.size} voucher đã chọn`}
          </button>
          {!urlOk && applyUrl.trim() !== '' && <span className="text-xs text-red-500">Link phải bắt đầu bằng http(s)://</span>}
          {applyUrl.trim() === '' && <span className="text-xs text-gray-400">Chưa có link để áp</span>}
          {msg && <span className="text-sm font-medium text-gray-700">{msg}</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              {['Mã code', 'Link affiliate hiện tại', 'Tình trạng', ''].map(h => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Provider này chưa có voucher nào</td></tr>
            )}
            {rows.map(v => {
              const st = stateOf(v);
              return (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={picked.has(v.id)} onChange={() => toggle(v.id)}
                      className="w-4 h-4 accent-indigo-600" />
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                    {v.code}
                    {!v.isActive && <span className="ml-2 text-xs font-sans font-normal text-gray-400">(off)</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-md truncate" title={v.affiliateUrl ?? ''}>
                    {v.affiliateUrl || (v.sourceUrl
                      ? <span className="text-gray-400 font-sans">— chỉ có link gốc —</span>
                      : <span className="text-amber-600 font-sans">— chưa có link nào —</span>)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATE_UI[st].cls}`}>
                      {STATE_UI[st].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/vouchers/${v.id}/edit`} className="text-xs text-indigo-600 hover:underline font-medium">Sửa</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
