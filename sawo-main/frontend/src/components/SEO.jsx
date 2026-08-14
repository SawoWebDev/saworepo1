// src/components/SEO.jsx
//
// Drop this at the top of every route-level page component to give it a real
// browser-tab title (was previously always "SAWO Inc." site-wide — see
// docs/go-live/SEO-GO-LIVE-CHECKLIST.md Scenario 4) plus a per-page meta
// description, canonical link, and Open Graph / Twitter Card tags for link
// previews (Slack, WhatsApp, Facebook, etc.).
//
// Usage:
//   <SEO
//     title="Tower Sauna Heaters"
//     description="SAWO Tower Series sauna heaters — elegant vertical design, ..."
//     path={menuPaths.sauna.heaters.tower}
//   />
//
// `title` is combined with the site name automatically — pass just the
// page-specific part, not "SAWO" itself. Omit `title` entirely to fall back
// to the site default (only Home should normally do this).
//
// CMS OVERRIDES: hub/category pages (everything routed through this
// component with a hard-coded title/description in JSX — i.e. everything
// EXCEPT the product/room/accessory detail pages, which already read their
// own meta_title/meta_description/og_image columns directly, see
// DispProduct.jsx) can be overridden from /admin/seo without a redeploy.
// See local-storage/pageSeo.js — same table-per-route shape as
// setup-seo-fields.sql's per-product columns, just for the pages that aren't
// tied to a product/room row. An override for `path` wins over whatever this
// component was called with; anything not overridden falls through to props.
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { getCachedPageSeoMap, getPageSeoOverride } from "../local-storage/pageSeo";

const SITE_NAME = "SAWO";
const DEFAULT_TITLE = "SAWO Inc. | Premium Sauna Heaters, Rooms and Accessories";
const DEFAULT_DESCRIPTION =
  "SAWO designs premium Finnish sauna heaters, steam generators, infrared saunas & sauna rooms, trusted in 90+ countries. Explore the full range.";
const DEFAULT_IMAGE = "/1920.webp"; // existing homepage hero, 1920x1080
const SITE_URL = "https://www.sawo.com";

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_IMAGE,
  noindex = false,
  // Already-complete title (e.g. from seo.json's "<Page> — <site>" copy) —
  // rendered as-is, skipping the "<title> | SAWO" auto-suffix below. Used by
  // locale routes whose translated title already includes the site name.
  rawTitle,
  // { en: "/", fi: "/fi", de: "/de" } — only pass this for a path that is
  // GENUINELY translated in every listed locale (see
  // i18n/translatedRoutes.js's TRANSLATED_PATHS comment). Asserting an
  // hreflang alternate for a locale that doesn't have real copy is worse for
  // SEO than omitting it (CRA-I18N-TRANSLATIONS-PLAN.md's hreflang gotcha).
  hreflangAlternates,
}) => {
  // Sync first (repeat visits paint the CMS override immediately, no flash
  // of the hard-coded default), then revalidate async — same two-phase
  // pattern as appSettings.js's getCachedSettings()/getSettings() pair.
  const [override, setOverride] = useState(() => {
    const cached = getCachedPageSeoMap();
    const row = cached?.[path];
    if (!row || (!row.meta_title && !row.meta_description && !row.og_image)) return null;
    return { title: row.meta_title || null, description: row.meta_description || null, image: row.og_image || null };
  });

  useEffect(() => {
    let cancelled = false;
    getPageSeoOverride(path).then((o) => {
      if (!cancelled) setOverride(o);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  const effectiveTitle = override?.title || title;
  const effectiveDescription = override?.description || description;
  const effectiveImage = override?.image || image;

  const fullTitle = override?.title || rawTitle
    ? (override?.title ? `${override.title} | ${SITE_NAME}` : rawTitle)
    : effectiveTitle ? `${effectiveTitle} | ${SITE_NAME}` : DEFAULT_TITLE;
  const url = `${SITE_URL}${path}`;
  const absoluteImage = effectiveImage.startsWith("http") ? effectiveImage : `${SITE_URL}${effectiveImage}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={effectiveDescription} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {hreflangAlternates && Object.entries(hreflangAlternates).map(([hreflang, altPath]) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={`${SITE_URL}${altPath}`} />
      ))}
      {hreflangAlternates && (
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${hreflangAlternates.en}`} />
      )}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={effectiveDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absoluteImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={effectiveDescription} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
};

export default SEO;
