import { redirect } from 'next/navigation';

// About được gộp vào trang Contact & About
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/contact`);
}
