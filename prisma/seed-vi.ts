/**
 * NẠP BẢN DỊCH TIẾNG VIỆT (dịch bằng Claude) cho một số bài chọn lọc.
 * Content đọc từ prisma/articles/vi/{slug}.md, title/excerpt khai báo bên dưới.
 * Chạy: ./node_modules/.bin/tsx prisma/seed-vi.ts
 *
 * Đánh dấu isAutoTranslated=false (bản chất lượng cao, tương đương đã review)
 * — bạn vẫn nên đọc lướt lại trước khi publish.
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

const VI_TRANSLATIONS = [
  {
    slug:    'how-to-secure-vps-first-10-minutes',
    file:    'how-to-secure-vps-first-10-minutes.md',
    title:   'Bảo mật VPS trong 10 phút đầu tiên',
    excerpt: 'Checklist gia cố server mới theo từng phút — cập nhật, tạo user không phải root, SSH key, tường lửa, Fail2ban, và tự động vá lỗi. Những bước chặn phần lớn các cuộc tấn công thực tế.',
  },
  {
    slug:    'how-to-deploy-nextjs-vps-2026',
    file:    'how-to-deploy-nextjs-vps.md',
    title:   'Cách triển khai Next.js lên VPS năm 2026 (Docker + Nginx + SSL)',
    excerpt: 'Hướng dẫn triển khai Next.js chuẩn production trên một VPS giá rẻ — standalone build, Docker, Nginx reverse proxy, và SSL miễn phí. Khi nào VPS thắng Vercel, và chi phí bảo trì thực tế.',
  },
  {
    slug:    'how-to-free-ssl-lets-encrypt-2026',
    file:    'how-to-free-ssl-lets-encrypt.md',
    title:   'Cách cài SSL miễn phí với Let\u2019s Encrypt năm 2026',
    excerpt: 'Lấy chứng chỉ HTTPS miễn phí, tự động gia hạn bằng Certbot trong vài phút, gồm cả wildcard và phương án Cloudflare. Kèm một lỗi cấu hình gây vòng lặp chuyển hướng.',
  },
];

async function main() {
  let done = 0;
  for (const t of VI_TRANSLATIONS) {
    const article = await prisma.article.findUnique({ where: { slug: t.slug } });
    if (!article) {
      console.log(`⚠ Không tìm thấy bài: ${t.slug} — bỏ qua`);
      continue;
    }

    const content = readFileSync(join(process.cwd(), 'prisma/articles/vi', t.file), 'utf8').trim();

    await prisma.articleTranslation.upsert({
      where:  { articleId_locale: { articleId: article.id, locale: 'vi' } },
      create: {
        articleId: article.id, locale: 'vi',
        title: t.title, excerpt: t.excerpt, content,
        isAutoTranslated: false, translatedAt: new Date(),
      },
      update: {
        title: t.title, excerpt: t.excerpt, content,
        isAutoTranslated: false, translatedAt: new Date(),
      },
    });

    done++;
    console.log(`✅ ${t.slug} → bản tiếng Việt (${content.split(/\s+/).length} từ)`);
  }
  console.log(`\n🎉 Đã nạp ${done} bản dịch tiếng Việt. Vào /admin/articles để xem và publish.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
