import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buildAlternates } from '@/lib/seo/alternates';
import Hero from '@/components/Home/Hero';
import Section1 from '@/components/Home/Section1';
import Section2 from '@/components/Home/Section2';
import Section3 from '@/components/Home/Section3';
import Section4 from '@/components/Home/Section4';
import Section5 from '@/components/Home/Section5';
import ExploreMoreLink from '@/components/Home/ExploreMoreLink';
import paths from '@/translation/routing';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  const { canonical, languages } = buildAlternates('/', locale);
  return {
    title: t('home.title'),
    description: t('home.description'),
    alternates: { canonical, languages },
  };
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Dynamic CMS-driven home content (site_content table) is a follow-up:
  // this Server Component ships the message-catalog copy as real, crawlable
  // HTML for now, which already satisfies the SEO goal for en/fi/de.
  return (
    <div>
      <Hero />
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section1 />
      </div>
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section2 />
        <div className="text-center mt-6">
          <ExploreMoreLink href={paths.sauna.heaters.parent} />
        </div>
      </div>
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section3 />
      </div>
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section4 />
      </div>
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section5 />
      </div>
    </div>
  );
}
