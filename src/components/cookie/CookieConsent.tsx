'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const COOKIE_NAME = 'dealeg_cookie_consent';

export function CookieConsent() {
  const t = useTranslations('cookie');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Kiểm tra đã đồng ý chưa (đọc cookie)
    const consent = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${COOKIE_NAME}=`));
    if (!consent) {
      // Hiện banner sau 1 giây (tránh giật layout khi load)
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    // Lưu đồng ý 1 năm
    const oneYear = 365 * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=accepted; max-age=${oneYear}; path=/; SameSite=Lax`;
    setVisible(false);
  }

  function decline() {
    // Vẫn lưu lựa chọn để không hỏi lại, nhưng đánh dấu declined
    const oneYear = 365 * 24 * 60 * 60;
    document.cookie = `${COOKIE_NAME}=declined; max-age=${oneYear}; path=/; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              {t('message')}{' '}
              <Link href="/privacy" className="text-indigo-600 hover:underline font-medium">
                {t('learnMore')}
              </Link>
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t('decline')}
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {t('accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
