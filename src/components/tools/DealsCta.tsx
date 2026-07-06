import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/** CTA cuối mỗi trang công cụ — dẫn người dùng về voucher */
export async function DealsCta() {
  const t = await getTranslations('tools');
  return (
    <div className="mt-12 pt-6 border-t border-gray-100">
      <Link href="/coupon" className="text-sm text-indigo-600 font-medium hover:underline">
        {t('dealsCta')} →
      </Link>
    </div>
  );
}
