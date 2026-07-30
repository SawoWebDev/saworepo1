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
import { Helmet } from "react-helmet-async";

const SITE_NAME = "SAWO";
const DEFAULT_TITLE = "SAWO Inc. | Premium Sauna Heaters, Rooms and Accessories";
const DEFAULT_DESCRIPTION =
  "SAWO designs premium Finnish sauna heaters, steam generators, infrared saunas & sauna rooms — trusted in 90+ countries. Explore the full range.";
const DEFAULT_IMAGE = "/1920.webp"; // existing homepage hero, 1920x1080
const SITE_URL = "https://www.sawo.com";

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_IMAGE,
  noindex = false,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const url = `${SITE_URL}${path}`;
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absoluteImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
};

export default SEO;
