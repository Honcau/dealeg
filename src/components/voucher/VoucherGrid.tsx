import { VoucherCard } from './VoucherCard';
import type { Voucher } from '@/types/voucher';

interface VoucherGridProps {
  vouchers: Voucher[];
}

export function VoucherGrid({ vouchers }: VoucherGridProps) {
  if (vouchers.length === 0) {
    return (
      <p className="text-center text-gray-400 py-16">No deals found.</p>
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
