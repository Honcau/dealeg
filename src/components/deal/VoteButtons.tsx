'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn }  from 'next-auth/react';

interface Props { voucherId: string }

export function VoteButtons({ voucherId }: Props) {
  const { data: session } = useSession();
  const [works,    setWorks]    = useState(0);
  const [expired,  setExpired]  = useState(0);
  const [userVote, setUserVote] = useState<'WORKS' | 'EXPIRED' | null>(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    fetch(`/api/votes?voucherId=${voucherId}`)
      .then(r => r.json())
      .then(d => { setWorks(d.works); setExpired(d.expired); setUserVote(d.userVote); });
  }, [voucherId]);

  async function vote(type: 'WORKS' | 'EXPIRED') {
    if (!session) { signIn('google'); return; }
    setLoading(true);
    const res  = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucherId, type }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.action === 'removed')  { setUserVote(null); }
      else                            { setUserVote(type); }
      // Refetch counts
      fetch(`/api/votes?voucherId=${voucherId}`)
        .then(r => r.json())
        .then(d => { setWorks(d.works); setExpired(d.expired); });
    }
    setLoading(false);
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">
        Voucher này còn dùng được không?
      </p>
      <div className="flex gap-3">
        {/* Còn dùng được */}
        <button
          onClick={() => vote('WORKS')}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
            userVote === 'WORKS'
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-green-400 hover:text-green-600'
          }`}
        >
          <span>✓</span>
          <span>Dùng được</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            userVote === 'WORKS' ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-500'
          }`}>{works}</span>
        </button>

        {/* Hết hạn / không dùng được */}
        <button
          onClick={() => vote('EXPIRED')}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
            userVote === 'EXPIRED'
              ? 'border-red-400 bg-red-50 text-red-600'
              : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-500'
          }`}
        >
          <span>✗</span>
          <span>Hết hạn</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
            userVote === 'EXPIRED' ? 'bg-red-200 text-red-700' : 'bg-gray-100 text-gray-500'
          }`}>{expired}</span>
        </button>
      </div>

      {!session && (
        <p className="text-xs text-gray-400 mt-2">
          <button onClick={() => signIn('google')} className="text-indigo-500 hover:underline">
            Đăng nhập
          </button>{' '}
          để vote
        </p>
      )}
    </div>
  );
}
