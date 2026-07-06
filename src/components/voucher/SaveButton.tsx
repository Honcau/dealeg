'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

/**
 * Nút lưu voucher (hình trái tim).
 * - Chưa đăng nhập → bấm đưa tới trang login
 * - Đã đăng nhập → toggle lưu/bỏ lưu
 */
export function SaveButton({ voucherId, size = 'sm' }: { voucherId: string; size?: 'sm' | 'lg' }) {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations('voucher');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  // Kiểm tra voucher này đã lưu chưa (chỉ khi đã đăng nhập)
  useEffect(() => {
    if (!session?.user || checked) return;
    fetch('/api/user/saved')
      .then(r => r.json())
      .then(d => {
        const isSaved = (d.saved ?? []).some((v: { id: string }) => v.id === voucherId);
        setSaved(isSaved);
        setChecked(true);
      })
      .catch(() => {});
  }, [session, voucherId, checked]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Chưa đăng nhập → tới login
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherId }),
      });
      const data = await res.json();
      setSaved(data.saved);
    } catch {}
    setLoading(false);
  }

  const dim = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? t('saved') : t('save')}
      className={`transition-colors ${saved ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}
    >
      <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className={dim}>
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
