'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Post   { id: string; author: string; title: string; url: string; body: string; postedAt: string; fetchedAt: string; status: string }
interface Source { id: string; username: string; note: string | null; isActive: boolean }

const DAY = 86_400_000;
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
  const [status, setStatus]   = useState<string>('NEW');
  const [username, setUsername] = useState('');
  const [open, setOpen]       = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState('');

  const load = useCallback(async (st = status) => {
    const r = await fetch(`/api/admin/offers?status=${st}`);
    const d = await r.json();
    if (r.ok) { setPosts(d.posts ?? []); setSources(d.sources ?? []); }
    setLoading(false);
  }, [status]);

  useEffect(() => { load(status); }, [load, status]);

  async function fetchNow() {
    setBusy(true); setMsg('Đang kéo feed LowEndTalk...');
    const r = await fetch('/api/admin/offers/fetch', { method: 'POST' });
    const d = await r.json();
    setBusy(false);
    setMsg(r.ok
      ? `✅ Feed ${d.fetched} bài · khớp provider theo dõi ${d.matched} · mới ${d.created} · đã có ${d.skipped}`
      : `✗ ${d.error ?? 'Lỗi kéo feed'}`);
    if (r.ok) load(status);
  }

  async function addSource() {
    const u = username.trim();
    if (!u) return;
    setBusy(true);
    const r = await fetch('/api/admin/offers/sources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u }),
    });
    setBusy(false);
    if (r.ok) { setUsername(''); setMsg(`✅ Đang theo dõi "${u}"`); load(status); }
    else setMsg('✗ Không thêm được');
  }

  async function removeSource(s: Source) {
    if (!confirm(`Bỏ theo dõi "${s.username}"?\nCác bài đã kéo về vẫn giữ nguyên.`)) return;
    await fetch('/api/admin/offers/sources', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id }),
    });
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Offers từ LowEndTalk</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Dữ liệu thô từ category Offers của các provider bạn theo dõi — đọc rồi tự tạo voucher.
        </p>
      </div>

      {/* Provider theo dõi + nút kéo feed */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Theo dõi username trên LowEndTalk
            </label>
            <div className="flex gap-2">
              <input value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSource()}
                placeholder="VD: DediRock" 
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={addSource} disabled={busy || !username.trim()}
                className="bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                Theo dõi
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Đúng tên tác giả hiện trên bài LET (phân biệt hoa thường không quan trọng).
            </p>
          </div>
          <button onClick={fetchNow} disabled={busy || sources.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-lg mt-5">
            {busy ? 'Đang kéo...' : '⟳ Lấy bài mới'}
          </button>
        </div>

        {sources.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {sources.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                {s.username}
                <button onClick={() => removeSource(s)} className="text-gray-400 hover:text-red-500 font-bold">×</button>
              </span>
            ))}
          </div>
        )}
        {sources.length === 0 && (
          <p className="text-sm text-amber-600 mt-4">
            Chưa theo dõi provider nào — thêm ít nhất 1 username rồi mới kéo được bài.
          </p>
        )}
        {msg && <p className="text-sm font-medium text-gray-700 mt-3">{msg}</p>}
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex gap-2 mb-4">
        {STATUSES.map(([v, label]) => (
          <button key={v} onClick={() => { setStatus(v); setLoading(true); }}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              status === v ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
        <span className="text-sm text-gray-400 self-center ml-1">{posts.length} bài</span>
      </div>

      {/* Danh sách bài — server đã sắp theo ngày TẠO giảm dần */}
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400">
            Không có bài nào
          </div>
        )}
        {posts.map(p => {
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
