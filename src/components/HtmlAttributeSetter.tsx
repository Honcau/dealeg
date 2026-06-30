'use client';

import { useEffect } from 'react';
import { isRtl }     from '@/i18n/routing';

/**
 * Set lang và dir trên <html> sau khi client mount.
 * Cần vì root layout không biết locale, nhưng locale layout thì biết.
 */
export function HtmlAttributeSetter({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir  = isRtl(locale) ? 'rtl' : 'ltr';
  }, [locale]);

  return null; // Không render gì cả
}
