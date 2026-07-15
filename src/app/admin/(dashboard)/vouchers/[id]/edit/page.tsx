'use client';

import { useEffect, useState } from 'react';
import { useParams }           from 'next/navigation';
import { VoucherForm }         from '@/components/admin/VoucherForm';
import { VoucherPasteTranslation } from '@/components/admin/VoucherPasteTranslation';
import type { VoucherFormData } from '@/components/admin/VoucherForm';

export default function EditVoucherPage() {
  const { id }  = useParams<{ id: string }>();
  const [data, setData]       = useState<Partial<VoucherFormData> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/vouchers/${id}`)
      .then(r => r.json())
      .then(v => {
        // Map Prisma model → VoucherFormData
        const viTrans = v.translations?.find((t: { locale: string }) => t.locale === 'vi');
        const enTrans = v.translations?.find((t: { locale: string }) => t.locale === 'en');
        setData({
          code:          v.code,
          provider:      v.provider,
          category:      v.category,
          discount:      v.discount,
          discountValue: v.discountValue ?? 0,
          affiliateUrl:  v.affiliateUrl ?? '',
          sourceUrl:     v.sourceUrl ?? '',
          expiresAt:     v.expiresAt ? new Date(v.expiresAt).toISOString().slice(0, 10) : '',
          isVerified:    v.isVerified,
          isActive:      v.isActive,
          hideCode:      v.hideCode ?? false,
          titleVi:       viTrans?.title       ?? '',
          descVi:        viTrans?.description ?? '',
          titleEn:       enTrans?.title       ?? '',
          descEn:        enTrans?.description ?? '',
        });
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-16 text-gray-400">Đang tải...</div>;
  if (!data)   return <div className="text-center py-16 text-red-400">Không tìm thấy voucher</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Sửa voucher</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <VoucherForm initial={data} voucherId={id} />
      </div>

      {/* Dịch Paste — miễn phí qua DeepL web */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Dịch Paste (miễn phí)</h2>
        <VoucherPasteTranslation voucherId={id} />
      </div>
    </div>
  );
}
