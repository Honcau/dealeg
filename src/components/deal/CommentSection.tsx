'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn }  from 'next-auth/react';
import Image                   from 'next/image';

interface Comment {
  id:        string;
  content:   string;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface Props { voucherId: string }

export function CommentSection({ voucherId }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [fetched,  setFetched]  = useState(false);

  useEffect(() => {
    fetch(`/api/comments?voucherId=${voucherId}`)
      .then(r => r.json())
      .then(d => { setComments(d); setFetched(true); });
  }, [voucherId]);

  async function submit() {
    if (!text.trim() || loading) return;
    setLoading(true);
    const res  = await fetch('/api/comments', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ voucherId, content: text }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments(prev => [c, ...prev]);
      setText('');
    }
    setLoading(false);
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Bình luận ({comments.length})
      </h2>

      {/* Form */}
      {session ? (
        <div className="flex gap-3 mb-6">
          {session.user?.image && (
            <Image src={session.user.image} alt="" width={32} height={32}
              className="rounded-full shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Chia sẻ trải nghiệm của bạn với voucher này..."
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{text.length}/500</span>
              <button
                onClick={submit}
                disabled={loading || !text.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {loading ? 'Đang gửi...' : 'Gửi'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-sm text-gray-500">
          <button onClick={() => signIn('google')} className="text-indigo-600 font-medium hover:underline">
            Đăng nhập
          </button>{' '}
          để bình luận và chia sẻ trải nghiệm
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {fetched && comments.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            Chưa có bình luận nào. Hãy là người đầu tiên!
          </p>
        )}
        {comments.map(c => (
          <div key={c.id} className="flex gap-3">
            {c.user.image ? (
              <Image src={c.user.image} alt="" width={32} height={32}
                className="rounded-full shrink-0 mt-0.5" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                {c.user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800">{c.user.name ?? 'Ẩn danh'}</span>
                <span className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString('vi', { day:'numeric', month:'short' })}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
