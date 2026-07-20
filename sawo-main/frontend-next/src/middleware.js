import createMiddleware from 'next-intl/middleware';
import { routing } from './translation/routing';

export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, admin, and anything with a file extension
  // (static assets, sitemap.xml, robots.txt) — none of those are localized.
  matcher: ['/((?!api|_next|_vercel|admin|login|.*\\..*).*)'],
};
