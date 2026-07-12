'use client';

import { useEffect, useState } from 'react';
import { NewsletterForm } from './NewsletterForm';

// Đánh dấu đã hiện → không làm phiền lại (xoá localStorage để reset khi test).
const SEEN_KEY = 'dealeg_exit_signup_v1';

/**
 * Popup exit-intent (Phase 0 capture): hiện tối đa 1 lần cho mỗi trình duyệt khi
 * người dùng có ý định rời trang (chuột ra khỏi mép trên), fallback mobile là cuộn
 * gần hết trang. Mount site-wide trong [locale]/layout.tsx.
 */
export function ExitIntentSignup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { if (localStorage.getItem(SEEN_KEY)) return; } catch { return; }

    let armed = false;
    const armTimer = setTimeout(() => { armed = true; }, 4000); // chờ 4s mới kích hoạt

    const trigger = () => {
      setOpen(true);
      try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch {}
      cleanup();
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (armed && e.clientY <= 0) trigger();
    };
    const onScroll = () => {
      if (armed && window.scrollY + window.innerHeight >= document.body.scrollHeight * 0.7) trigger();
    };

    function cleanup() {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    }

    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(armTimer); cleanup(); };
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={() => setOpen(false)}
    >
      <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 text-lg leading-none"
        >
          ×
        </button>
        <NewsletterForm source="exit-intent" variant="card" />
      </div>
    </div>
  );
}
