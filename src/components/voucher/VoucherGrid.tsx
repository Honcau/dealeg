import { getTranslations } from 'next-intl/server';
import { VoucherCard } from './VoucherCard';
import type { Voucher } from '@/types/voucher';

interface VoucherGridProps {
  vouchers: Voucher[];
}

/** Server component — 3 nơi gọi (trang chủ, tìm kiếm, danh mục) đều là server component. */
export async function VoucherGrid({ vouchers }: VoucherGridProps) {
  if (vouchers.length === 0) {
    const t = await getTranslations('search');
    return (
      <p className="text-center text-gray-400 py-16">{t('noResults')}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {vouchers.map((voucher) => (
        <VoucherCard key={voucher.id} voucher={voucher} />
      ))}
    </div>
  );
}
