import { permanentRedirect } from 'next/navigation';

// About được gộp vào trang Contact & About.
// permanentRedirect (308) chứ KHÔNG phải redirect (307): 307 là "tạm thời" nên Google
// giữ lại /about trong index song song /contact → sinh cụm trùng lặp (đúng lỗi
// "Duplicate without user-selected canonical" của các trang /contact trong GSC).
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/contact`);
}
