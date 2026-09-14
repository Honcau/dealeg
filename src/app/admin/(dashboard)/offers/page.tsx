'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Post     { id: string; source: string; author: string; title: string; url: string; body: string; tags: string[]; postedAt: string; fetchedAt: string; status: string; matched: string | null }
interface Source   { id: string; username: string; note: string | null; providerId: string | null; isActive: boolean }
interface Provider { id: string; name: string }

const EMPTY_FORM = { username: '', note: '', providerId: '' };

const DAY = 86_400_000;
interface SourceMeta { key: string; label: string }

// Màu theo nguồn; nguồn lạ vẫn hiện được nhờ fallback xám.
const SOURCE_CLS: Record<string, string> = {
  lowendtalk:        'bg-purple-100 text-purple-700',
  lowendspirit:      'bg-sky-100 text-sky-700',
  lowendbox:         'bg-teal-100 text-teal-700',
  hostingdiscussion: 'bg-orange-100 text-orange-700',
};
const srcCls = (k: string) => SOURCE_CLS[k] ?? 'bg-gray-100 text-gray-600';

const STATUSES = [['NEW', 'Chưa xử lý'], ['DONE', 'Đã xử lý'], ['IGNORED', 'Bỏ qua'], ['ALL', 'Tất cả']] as const;

function ago(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
  if (d <= 0) return 'hôm nay';
  if (d < 30) return `${d} ngày trước`;
  if (d < 365) return `${Math.floor(d / 30)} tháng trước`;
  return `${Math.floor(d / 365)} năm trước`;
}

export default function AdminOffersPage() {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [counts, setCounts]   = useState<Record<string, number>>({});
  const [providers, setProviders] = useState<Provider[]>([]);
  const [status, setStatus]   = useState<string>('NEW');
  const [srcFilter, setSrcFilter] = useState<string>('ALL');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [sourceMeta, setSourceMeta] = useState<SourceMeta[]>([]);
  const [form, setForm]       = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen]       = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState('');

  const load = useCallback(async (st = status) => {
    const r = await fetch(`/api/admin/offers?status=${st}`);
    const d = await r.json();
    if (r.ok) {
      setPosts(d.posts ?? []); setSources(d.sources ?? []);
      setCounts(d.counts ?? {}); setProviders(d.providers ?? []);
      setSourceMeta(d.sourceMeta ?? []);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => { load(status); }, [load, status]);

  async function fetchNow() {
    setBusy(true); setMsg('Đang kéo feed LowEndTalk + LowEndBox...');
    const r = await fetch('/api/admin/offers/fetch', { method: 'POST' });
    const d = await r.json();
    setBusy(false);

    if (!r.ok) { setMsg(`✗ ${d.error ?? 'Lỗi kéo feed'}`); return; }
    // Một nguồn hỏng không làm hỏng nguồn kia → báo riêng từng nguồn
    setMsg(Object.entries(d.results ?? {}).map(([src, v]) => {
      const name = sourceMeta.find(m => m.key === src)?.label ?? src;
      const x = v as { error?: string; fetched?: number; matched?: number; created?: number; skipped?: number };
      return x.error ? `✗ ${name}: ${x.error}` : `${name}: feed ${x.fetched} · lấy ${x.matched} · mới ${x.created}`;
    }).join('  |  '));
    load(status);
  }

  const setF = (k: keyof typeof EMPTY_FORM, v: string) => setForm(p => ({ ...p, [k]: v }));
  function resetForm() { setForm({ ...EMPTY_FORM }); setEditingId(null); }
  function startEdit(s: Source) {
    setForm({ username: s.username, note: s.note ?? '', providerId: s.providerId ?? '' });
    setEditingId(s.id);
    setMsg('');
  }

  /** Thêm mới (POST) hoặc cập nhật (PATCH) tuỳ đang sửa hay không. */
  async function saveSource() {
    const username = form.username.trim();
    if (!username) return;
    setBusy(true);

    const body = editingId
      ? { id: editingId, username, note: form.note.trim() || null, providerId: form.providerId || null }
      : { username, note: form.note.trim() || undefined };

    const r = await fetch('/api/admin/offers/sources', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);

    if (r.ok) { setMsg(editingId ? `✅ Đã cập nhật "${username}"` : `✅ Đang theo dõi "${username}"`); resetForm(); load(status); }
    else setMsg('✗ ' + (typeof d.error === 'string' ? d.error : 'Không lưu được'));
  }

  /** Ẩn/hiện: tạm dừng theo dõi mà KHÔNG mất các bài đã kéo về. */
  async function toggleActive(s: Source) {
    setBusy(true);
    await fetch('/api/admin/offers/sources', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, isActive: !s.isActive }),
    });
    setBusy(false); load(status);
  }

  async function removeSource(s: Source) {
    if (!confirm(`Xoá nguồn "${s.username}"?\nCác bài đã kéo về vẫn giữ nguyên. Muốn tạm dừng thì dùng "Ẩn".`)) return;
    await fetch('/api/admin/offers/sources', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
    });
    if (editingId === s.id) resetForm();
    load(status);
  }

  async function setPostStatus(id: string, st: string) {
    setPosts(prev => prev.filter(p => status === 'ALL' || p.id !== id));   // biến mất khỏi tab hiện tại
    await fetch('/api/admin/offers', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: st }),
    });
  }

  const toggle = (id: string) =>
    setOpen(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (loading) return <div className="text-center py-16 text-gray-400">Đang tải...</div>;

  const shown = posts
    .filter(p => srcFilter === 'ALL' || p.source === srcFilter)
    .filter(p => !onlyStarred || p.matched);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Offers từ LowEndTalk</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Dữ liệu thô từ category Offers của các provider bạn theo dõi — đọc rồi tự tạo voucher.
        </p>
      </div>

      {/* Nguồn theo dõi: form thêm/sửa + bảng quản lý */}
      <div className={`bg-white rounded-xl border p-6 mb-6 ${editingId ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            {editingId ? 'Sửa nguồn theo dõi' : 'Nguồn theo dõi trên LowEndTalk'}
          </h2>
          <button onClick={fetchNow} disabled={busy || sources.filter(s => s.isActive).length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg">
            {busy ? 'Đang xử lý...' : '⟳ Lấy bài mới'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Username trên LET *</label>
            <input value={form.username} onChange={e => setF('username', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveSource()}
              placeholder="VD: DediRock"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
            <input value={form.note} onChange={e => setF('note', e.target.value)}
              placeholder="VD: VPS Mỹ, hay có coupon"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Provider trong dealeg <span className="text-gray-400">(tùy chọn)</span>
            </label>
            <select value={form.providerId} onChange={e => setF('providerId', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">— chưa nối —</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={saveSource} disabled={busy || !form.username.trim()}
            className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            {editingId ? '💾 Cập nhật' : '➕ Theo dõi'}
          </button>
          {editingId && (
            <button onClick={resetForm} className="text-sm text-gray-500 hover:underline">Huỷ</button>
          )}
          {msg && <span className="text-sm font-medium text-gray-700">{msg}</span>}
        </div>

        {sources.length === 0 ? (
          <p className="text-sm text-amber-600 mt-5">
            Chưa theo dõi nguồn nào — thêm ít nhất 1 username rồi mới kéo được bài.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  {['Username', 'Ghi chú', 'Provider', 'Trạng thái', 'Bài đã kéo', ''].map(h => (
                    <th key={h} className="px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sources.map(s => {
                  const n = counts[s.username.toLowerCase()] ?? 0;
                  return (
                    <tr key={s.id} className={`border-b border-gray-100 ${editingId === s.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-3 py-2.5 font-medium text-gray-900">{s.username}</td>
                      <td className="px-3 py-2.5 text-gray-500">{s.note || <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {providers.find(p => p.id === s.providerId)?.name ?? <span className="text-gray-300">chưa nối</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.isActive ? 'Đang theo dõi' : 'Đã ẩn'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 tabular-nums">{n}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-3 justify-end">
                          <button onClick={() => startEdit(s)} className="text-xs text-indigo-600 hover:underline font-medium">Sửa</button>
                          <button onClick={() => toggleActive(s)} className="text-xs text-amber-600 hover:underline font-medium">
                            {s.isActive ? 'Ẩn' : 'Hiện'}
                          </button>
                          <button onClick={() => removeSource(s)} className="text-xs text-red-500 hover:underline font-medium">Xoá</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-2">
              Đổi username thì các bài đã kéo về vẫn giữ tên tác giả cũ (là lịch sử đúng của feed),
              nên cột &quot;Bài đã kéo&quot; sẽ về 0 cho tới lần kéo tiếp theo. &quot;Ẩn&quot; để tạm dừng mà không mất bài.
            </p>
          </div>
        )}
      </div>

      {/* Bộ lọc trạng thái + nguồn */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {STATUSES.map(([v, label]) => (
          <button key={v} onClick={() => { setStatus(v); setLoading(true); }}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              status === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
        <span className="text-gray-300 mx-1">|</span>
        {[{ key: 'ALL', label: 'Mọi nguồn' }, ...sourceMeta].map(({ key: v, label }) => (
          <button key={v} onClick={() => setSrcFilter(v)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              srcFilter === v ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
        <label className="flex items-center gap-1.5 text-sm text-gray-600 ml-1 cursor-pointer select-none">
          <input type="checkbox" checked={onlyStarred} onChange={e => setOnlyStarred(e.target.checked)}
            className="w-4 h-4 accent-indigo-600" />
          chỉ bài có ★
        </label>
        <span className="text-sm text-gray-400 self-center ml-1">{shown.length} bài</span>
      </div>

      {/* Danh sách bài — server đã sắp theo ngày TẠO giảm dần */}
      <div className="space-y-3">
        {shown.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
            Không có bài nào
          </div>
        )}
        {shown.map(p => {
          const stale = Date.now() - new Date(p.postedAt).getTime() > 30 * DAY;
          const isOpen = open.has(p.id);
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <a href={p.url} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-gray-900 hover:text-indigo-600 break-words">
                    {p.title}
                  </a>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${srcCls(p.source)}`}>
                      {sourceMeta.find(m => m.key === p.source)?.label ?? p.source}
                    </span>
                    {p.matched && (
                      <span title="Bài này nhắc tới provider bạn đang theo dõi"
                        className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
                        ★ {p.matched}
                      </span>
                    )}
                    <span className="font-medium text-gray-700">{p.author}</span>
                    <span className="text-gray-400">· đăng {ago(p.postedAt)}</span>
                    {stale && (
                      <span title="Thread tạo đã lâu — nổi lên feed vì có người comment, nhiều khả năng không có offer mới"
                        className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                        thread cũ bị bump
                      </span>
                    )}
                    {p.status !== 'NEW' && (
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{p.status}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href="/admin/vouchers/new" target="_blank"
                    className="text-xs font-medium text-indigo-600 hover:underline whitespace-nowrap">+ Tạo voucher</Link>
                  {p.status !== 'DONE'    && <button onClick={() => setPostStatus(p.id, 'DONE')}    className="text-xs font-medium text-green-600 hover:underline">Đã xử lý</button>}
                  {p.status !== 'IGNORED' && <button onClick={() => setPostStatus(p.id, 'IGNORED')} className="text-xs font-medium text-gray-400 hover:underline">Bỏ qua</button>}
                </div>
              </div>

              <pre className={`mt-3 text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3 overflow-x-auto ${isOpen ? '' : 'max-h-40 overflow-hidden'}`}>
                {p.body}
              </pre>
              {p.body.length > 400 && (
                <button onClick={() => toggle(p.id)} className="text-xs text-indigo-600 hover:underline mt-2">
                  {isOpen ? 'Thu gọn' : 'Xem đầy đủ'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
