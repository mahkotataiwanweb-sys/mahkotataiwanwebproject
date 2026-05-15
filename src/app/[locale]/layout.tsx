import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SmoothScrollProvider from '@/components/layout/SmoothScrollProvider';
import LoadingScreen from '@/components/layout/LoadingScreen';
import ScrollProgress from '@/components/effects/ScrollProgress';
import { buildPageMetadata, organizationJsonLd } from '@/lib/seo';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ path: '/', locale });
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as typeof routing.locales[number])) notFound();
  setRequestLocale(locale as typeof routing.locales[number]);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {/* Organization schema — injected once for the whole locale tree. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <LoadingScreen />
      <ScrollProgress />
      <SmoothScrollProvider>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </SmoothScrollProvider>
    </NextIntlClientProvider>
  );
}
