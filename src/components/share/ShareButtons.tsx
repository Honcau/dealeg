'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  url?:   string;   // URL chia sẻ, mặc định = trang hiện tại
  title?: string;   // tiêu đề kèm theo
}

export function ShareButtons({ url, title = '' }: Props) {
  const t = useTranslations('share');
  const [copied, setCopied] = useState(false);

  // URL hiện tại (client-side)
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  // Các kênh chia sẻ — ưu tiên kênh phổ biến ở VN
  const channels = [
    {
      name: 'Facebook',
      color: 'bg-[#1877F2] hover:bg-[#0d6ae0]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.43c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.24h3.32l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/>
        </svg>
      ),
    },
    {
      name: 'Zalo',
      color: 'bg-[#0068FF] hover:bg-[#0055d4]',
      href: `https://zalo.me/share/?u=${encodedUrl}`,
      icon: (
        <svg viewBox="0 0 48 48" fill="currentColor" className="w-4 h-4">
          <path d="M24 4C12.4 4 3 12.6 3 23.2c0 5.9 2.9 11.2 7.5 14.8v6.5l6.1-3.4c2.3.7 4.8 1.1 7.4 1.1 11.6 0 21-8.6 21-19.2S35.6 4 24 4zm-9.6 22.6h-4c-.5 0-.9-.4-.9-.9V18c0-.5.4-.9.9-.9s.9.4.9.9v6.8h3.1c.5 0 .9.4.9.9s-.4.9-.9.9zm5-.9c0 .5-.4.9-.9.9s-.9-.4-.9-.9V18c0-.5.4-.9.9-.9s.9.4.9.9v7.7zm9.3.9c-.2 0-.5-.1-.6-.3l-4.3-5.4v4.8c0 .5-.4.9-.9.9s-.9-.4-.9-.9V18c0-.4.2-.7.6-.8.4-.1.7 0 1 .3l4.3 5.4V18c0-.5.4-.9.9-.9s.9.4.9.9v7.7c0 .4-.3.7-.6.8-.1.1-.2.1-.4.1zm8.4 0h-4c-.5 0-.9-.4-.9-.9V18c0-.5.4-.9.9-.9h4c.5 0 .9.4.9.9s-.4.9-.9.9h-3.1v2.1h3.1c.5 0 .9.4.9.9s-.4.9-.9.9h-3.1v2.1h3.1c.5 0 .9.4.9.9s-.4.8-.9.8z"/>
        </svg>
      ),
    },
    {
      name: 'X',
      color: 'bg-black hover:bg-gray-800',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zM17.6 20.65h2.04L6.49 3.24H4.3z"/>
        </svg>
      ),
    },
    {
      name: 'Telegram',
      color: 'bg-[#0088cc] hover:bg-[#0077b3]',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
        </svg>
      ),
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500 font-medium mr-1">{t('label')}:</span>
      {channels.map(ch => (
        <a
          key={ch.name}
          href={ch.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`${t('shareOn')} ${ch.name}`}
          className={`${ch.color} text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors`}
        >
          {ch.icon}
        </a>
      ))}
      {/* Nút copy link */}
      <button
        onClick={copyLink}
        title={t('copyLink')}
        className="bg-gray-100 hover:bg-gray-200 text-gray-600 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-600">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  );
}
