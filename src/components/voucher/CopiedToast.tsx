'use client';

/**
 * Thông báo hiện mỗi khi bấm "Nhận mã".
 *
 * Dùng position fixed để nổi trên mọi thứ và KHÔNG bị cắt bởi card.
 * - Trình duyệt thường: bấm mở tab affiliate, trình duyệt tự chuyển focus sang tab đó
 *   (không API nào ép mở tab nền được). Tab dealeg.com vẫn giữ nguyên trang, toast còn
 *   đó khi user quay lại.
 * - In-app browser (bot Telegram/Facebook...): webview không có tab nên ta điều hướng
 *   ngay trong khung đó — toast kịp hiện 1 nhịp trước khi đi.
 *
 * `ok=false` khi copy thất bại → nói thật để user tự bôi đen mã, thay vì báo
 * "đã copy" rồi họ dán ra khoảng trắng ở trang thanh toán.
 */
export function CopiedToast({ message, ok = true }: { message: string; ok?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5
                 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl
                 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-bottom-2"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        className={`w-4 h-4 shrink-0 ${ok ? 'text-green-400' : 'text-amber-400'}`}>
        {ok
          ? <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          : <><path d="M12 9v4" strokeLinecap="round" /><path d="M12 17h.01" strokeLinecap="round" />
             <circle cx="12" cy="12" r="9" /></>}
      </svg>
      <span>{message}</span>
    </div>
  );
}
