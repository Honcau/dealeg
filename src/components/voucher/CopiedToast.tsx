'use client';

/**
 * Thông báo "Code copied! Paste it at checkout." hiện mỗi khi bấm "Nhận mã".
 *
 * Dùng position fixed để nổi trên mọi thứ và KHÔNG bị cắt bởi card.
 * Bấm "Nhận mã" sẽ mở tab affiliate — trình duyệt tự chuyển focus sang tab đó
 * (không API nào ép mở tab nền được). Tab dealeg.com vẫn giữ nguyên trang, và
 * toast còn nằm đó khi user quay lại nên vẫn đọc được.
 */
export function CopiedToast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5
                 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl
                 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-2"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        className="w-4 h-4 shrink-0 text-green-400">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
