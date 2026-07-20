import { SITE_URL } from './alternates';

export function organizationJsonLd(description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SAWO',
    url: SITE_URL,
    logo: `${SITE_URL}/logo512.png`,
    description,
    sameAs: [
      'https://www.facebook.com/SAWOsaunaworld',
      'https://www.instagram.com/sawosauna/',
      'https://ph.linkedin.com/company/sawo-inc',
      'https://www.youtube.com/@SAWOsauna',
      'https://www.tiktok.com/@sawosauna',
    ],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SAWO',
    url: SITE_URL,
  };
}
