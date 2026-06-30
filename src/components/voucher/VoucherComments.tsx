'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  text: string;
  user: { id: string; name: string | null; image: string | null };
  votes: { userId: string; value: number }[];
  createdAt: string;
}

interface Props {
  voucherId: string;
}

export function VoucherComments({ voucherId }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadComments() {
    const res = await fetch(`/api/comments?voucherId=${voucherId}`);
    const data = await res.json();
    setComments(data);
  }

  useEffect(() => { loadComments(); }, [voucherId]);

  async function handleSubmit() {
    if (!session?.user) {
      signIn();
      return;
    }
    if (!newComment.trim()) return;

    setLoading(true);
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherId, text: newComment }),
    });

    if (res.ok) {
      setNewComment('');
      await loadComments();
    }
    setLoading(false);
  }

  async function handleVote(commentId: string, value: 1 | -1) {
    if (!session?.user) {
      signIn();
      return;
    }
    await fetch(`/api/comments/${commentId}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: String(value) }),
    });
    await loadComments();
  }

  const stillWorks = comments.reduce((sum, c) => sum + c.votes.filter(v => v.value === 1).length, 0);
  const expired = comments.reduce((sum, c) => sum + c.votes.filter(v => v.value === -1).length, 0);

  return (
    <div className="mt-8 border-t border-gray-200 pt-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Xác nhận từ cộng đồng</h3>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-green-600">✓ {stillWorks} Còn dùng được</span>
        <span className="text-red-600">✗ {expired} Đã hết hạn</span>
      </div>

      {/* Comment form */}
      {session?.user ? (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Voucher này còn hoạt động không? Chia sẻ trải nghiệm của bạn..."
            className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={2}
            maxLength={500}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !newComment.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
          >
            {loading ? 'Đang gửi...' : 'Gửi bình luận'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn()}
          className="text-sm text-indigo-600 hover:underline"
        >
          Đăng nhập để bình luận
        </button>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments.map(comment => {
          const userUpvotes = comment.votes.filter(v => v.userId === session?.user?.id && v.value === 1).length > 0;
          const userDownvotes = comment.votes.filter(v => v.userId === session?.user?.id && v.value === -1).length > 0;
          const upvotes = comment.votes.filter(v => v.value === 1).length;
          const downvotes = comment.votes.filter(v => v.value === -1).length;

          return (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{comment.user.name}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(comment.createdAt).toLocaleDateString('vi')}
                </span>
              </div>
              <p className="text-gray-700">{comment.text}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleVote(comment.id, 1)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    userUpvotes
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600 hover:bg-green-100'
                  }`}
                >
                  ✓ Còn ({upvotes})
                </button>
                <button
                  onClick={() => handleVote(comment.id, -1)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    userDownvotes
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-200 text-gray-600 hover:bg-red-100'
                  }`}
                >
                  ✗ Hết ({downvotes})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
