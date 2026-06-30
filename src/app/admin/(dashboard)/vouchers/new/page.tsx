import { VoucherForm } from '@/components/admin/VoucherForm';

export const metadata = { title: 'Thêm voucher | Admin' };

export default function NewVoucherPage() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Thêm voucher mới</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <VoucherForm />
      </div>
    </div>
  );
}
