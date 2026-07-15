import { VoucherForm }          from '@/components/admin/VoucherForm';
import type { VoucherFormData } from '@/components/admin/VoucherForm';

export const metadata = { title: 'Thêm voucher | Admin' };

// Có thể điền sẵn từ submission: /admin/vouchers/new?code=..&provider=..&description=..
export default async function NewVoucherPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; provider?: string; description?: string }>;
}) {
  const sp = await searchParams;
  const initial: Partial<VoucherFormData> = {};
  if (sp.code)        initial.code     = sp.code;
  if (sp.provider)    initial.provider = sp.provider;
  if (sp.description) initial.descVi   = sp.description;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Thêm voucher mới</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <VoucherForm initial={Object.keys(initial).length ? initial : undefined} />
      </div>
    </div>
  );
}
