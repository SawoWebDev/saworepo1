import { SITE_URL } from '@/lib/seo/alternates';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
