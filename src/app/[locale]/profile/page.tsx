'use client';

import { useSession }   from 'next-auth/react';
import { useRouter }    from 'next/navigation';
import { useState, useEffect } from 'react';
import Image             from 'next/image';

interface UserComment {
  id: string;
  text: string;
  createdAt: string;
  voucher: { id: string; code: string; provider: string };
  votes: { value: number }[];
}

interface LinkedAccount {
  provider: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [name,        setName]        = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [comments,    setComments]    = useState<UserComment[]>([]);
  const [accounts,    setAccounts]    = useState<LinkedAccount[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? '');
      fetchUserData();
    }
  }, [session]);

  async function fetchUserData() {
    const res = await fetch('/api/profile');
    if (!res.ok) return;
    const data = await res.json();
    setComments(data.comments ?? []);
    setAccounts(data.accounts ?? []);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      await update({ name }); // Cập nhật session
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (status === 'loading') {
    return <div className="flex justify-center py-20 text-gray-400">Đang tải...</div>;
  }

  if (!session) return null;

  const providerColors: Record<string, string> = {
    google:   'bg-blue-100 text-blue-700',
    facebook: 'bg-blue-600 text-white',
    github:   'bg-gray-900 text-white',
    credentials: 'bg-indigo-100 text-indigo-700',
  };

  const providerLabels: Record<string, string> = {
    google:      'Google',
    facebook:    'Facebook',
    github:      'GitHub',
    credentials: 'Email',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-extrabold text-gray-900">Hồ sơ của bạn</h1>

      {/* Avatar + basic info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name ?? 'Avatar'}
              width={64} height={64}
              className="rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>
        </div>

        {/* Chỉnh tên */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên hiển thị
          </label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saved ? '✓ Đã lưu' : saving ? '...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>

      {/* Tài khoản liên kết */}
      {accounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tài khoản liên kết</h2>
          <div className="flex flex-wrap gap-2">
            {accounts.map(acc => (
              <span
                key={acc.provider}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${providerColors[acc.provider] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {providerLabels[acc.provider] ?? acc.provider}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bình luận của tôi */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          Bình luận của tôi
          <span className="ml-2 text-sm font-normal text-gray-400">({comments.length})</span>
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có bình luận nào.</p>
        ) : (
          <div className="space-y-3">
            {comments.map(c => {
              const upvotes   = c.votes.filter(v => v.value === 1).length;
              const downvotes = c.votes.filter(v => v.value === -1).length;
              return (
                <div key={c.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <a
                      href={`/provider/${c.voucher.provider.toLowerCase()}`}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      {c.voucher.provider} · {c.voucher.code}
                    </a>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('vi')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{c.text}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span className="text-green-600">✓ {upvotes}</span>
                    <span className="text-red-500">✗ {downvotes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
