import { NextIntlClientProvider } from 'next-intl';
import { getTranslations, getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/translation/routing';
import { buildAlternates } from '@/lib/seo/alternates';
import { organizationJsonLd, websiteJsonLd } from '@/lib/seo/jsonld';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import BackToTop from '@/components/BackToTop';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { getLanguageSwitcherSettings } from '@/translation/settings';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  const { canonical, languages } = buildAlternates('/', locale);

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sawo.com'),
    title: {
      template: `%s | ${t('siteName')}`,
      default: t('home.title'),
    },
    description: t('home.description'),
    alternates: { canonical, languages },
    openGraph: {
      siteName: t('siteName'),
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Enables static rendering for this locale's Server Components.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'seo' });
  const messages = await getMessages();

  const { enabled: langSwitcherEnabled, languages: enabledLanguages } = await getLanguageSwitcherSettings();
  // Always let the current locale show in the switcher itself, even if an
  // admin hid it from the "enabled" list — you're already looking at it, and
  // this only affects the switcher's own option list, not routing/sitemap.
  const switcherLocales = Array.from(new Set([...enabledLanguages, locale]));

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="flex flex-col min-h-screen bg-white text-[#333] font-[Montserrat] transition-colors duration-300">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(t('organization.description'))) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Header switcherLocales={langSwitcherEnabled ? switcherLocales : null} />
          <main className="flex-1 relative z-0">{children}</main>
          <Footer />
          <BackToTop />
          <AnalyticsTracker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
