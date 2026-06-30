import type { Metadata }             from 'next';
import { SessionProvider }           from 'next-auth/react';
import { NextIntlClientProvider }    from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound }                  from 'next/navigation';
import { routing }                   from '@/i18n/routing';
import { HtmlAttributeSetter }       from '@/components/HtmlAttributeSetter';
import { Header }                    from '@/components/layout/Header';
import { Footer }                    from '@/components/layout/Footer';

type Props = {
  children: React.ReactNode;
  params:   Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: {
      template: `%s | ${t('appName')}`,
      default:  `${t('appName')} — ${t('tagline')}`,
    },
    description: t('tagline'),
    metadataBase: new URL('https://dealeg.com'),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `https://dealeg.com/${loc}`])
      ),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  // KHÔNG có <html>/<body> ở đây — root layout đã có rồi.
  // HtmlAttributeSetter set lang/dir phía client.
  return (
    <SessionProvider>
      <NextIntlClientProvider messages={messages}>
        <HtmlAttributeSetter locale={locale} />
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
