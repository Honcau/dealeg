/**
 * SCRAPER ORCHESTRATOR
 * Chạy coupert + dealhack song song cho tất cả providers.
 * Merge + dedup kết quả, upsert vào DB.
 */
import { prisma }          from '@/lib/db';
import { scrapeCoupert }   from './coupert';
import { scrapeDealhack }  from './dealhack';
import { PROVIDERS }       from './providers';
import { sleep }           from './utils';
import type { ScrapedVoucher } from './types';

const DELAY_MS = 1500; // Đợi 1.5s giữa mỗi request — lịch sự với server

/** Dedup: giữ voucher có successRate cao nhất nếu cùng code+provider */
function dedup(vouchers: ScrapedVoucher[]): ScrapedVoucher[] {
  const map = new Map<string, ScrapedVoucher>();
  for (const v of vouchers) {
    const key      = `${v.provider}::${v.code}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, v);
    } else {
      // Ưu tiên verified và successRate cao hơn
      const betterVerified = v.isVerified && !existing.isVerified;
      const betterRate     = (v.successRate ?? 0) > (existing.successRate ?? 0);
      if (betterVerified || betterRate) map.set(key, v);
    }
  }
  return [...map.values()];
}

export async function runAllScrapers(): Promise<{ total: number; newCount: number; updated: number }> {
  console.log(`\n🚀 Starting scraper run — ${PROVIDERS.length} providers\n`);

  const allRaw: ScrapedVoucher[] = [];

  for (const provider of PROVIDERS) {
    // Chạy coupert + dealhack song song cho cùng 1 provider
    const [coupertResults, dealhackResults] = await Promise.allSettled([
      scrapeCoupert(provider),
      scrapeDealhack(provider),
    ]);

    if (coupertResults.status  === 'fulfilled') allRaw.push(...coupertResults.value);
    if (dealhackResults.status === 'fulfilled') allRaw.push(...dealhackResults.value);

    // Delay lịch sự trước provider tiếp theo
    await sleep(DELAY_MS);
  }

  const vouchers = dedup(allRaw);
  console.log(`\n📦 Unique vouchers after dedup: ${vouchers.length} (raw: ${allRaw.length})\n`);

  let newCount = 0;
  let updated  = 0;

  for (const v of vouchers) {
    const existing = await prisma.voucher.findFirst({
      where: { code: v.code, provider: v.provider },
    });

    if (existing) {
      await prisma.voucher.update({
        where: { id: existing.id },
        data: {
          discount:      v.discount,
          discountValue: v.discountValue,
          affiliateUrl:  v.affiliateUrl,
          expiresAt:     v.expiresAt ?? null,
          isVerified:    v.isVerified || existing.isVerified, // 1 lần verified = mãi verified
          successRate:   v.successRate ?? existing.successRate,
          sourceUrl:     v.sourceUrl,
          isActive:      true,
          updatedAt:     new Date(),
        },
      });
      updated++;
    } else {
      await prisma.voucher.create({
        data: {
          code:          v.code,
          discount:      v.discount,
          discountValue: v.discountValue,
          provider:      v.provider,
          category:      v.category,
          affiliateUrl:  v.affiliateUrl,
          expiresAt:     v.expiresAt ?? null,
          isVerified:    v.isVerified,
          successRate:   v.successRate,
          sourceUrl:     v.sourceUrl,
          isActive:      true,
        },
      });
      newCount++;
    }
  }

  // Tự động đánh dấu voucher hết hạn
  const expired = await prisma.voucher.updateMany({
    where: { expiresAt: { lt: new Date() }, isActive: true },
    data:  { isActive: false },
  });

  console.log(`✅ Done: +${newCount} mới · ~${updated} cập nhật · ${expired.count} đã đánh dấu hết hạn`);
  return { total: vouchers.length, newCount, updated };
}
