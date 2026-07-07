/**
 * SET COVER IMAGES — gán featured image cho tất cả bài viết.
 * Ảnh nằm ở /public/blog-covers/{slug}.png (tạo sẵn, phục vụ tĩnh).
 * Chạy: ./node_modules/.bin/tsx prisma/set-covers.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.findMany({ select: { id: true, slug: true } });
  let updated = 0;

  for (const a of articles) {
    await prisma.article.update({
      where: { id: a.id },
      data: { coverImage: `/blog-covers/${a.slug}.png` },
    });
    updated++;
    console.log(`✅ ${a.slug} → /blog-covers/${a.slug}.png`);
  }

  console.log(`\n🎉 Đã gán cover cho ${updated} bài.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
