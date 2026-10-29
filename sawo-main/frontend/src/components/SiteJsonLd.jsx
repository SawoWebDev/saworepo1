// Organization + WebSite JSON-LD for the homepage (all locales). Only facts
// already public on the site: social links and mailboxes from Footer/Contact,
// logo from public/. No SearchAction on purpose — the site search is an
// in-header dropdown with no results URL for Google to link to.
// SITE_URL is the go-live domain (same one SEO.jsx uses for canonicals), so
// this stays correct on the saworepo1.pages.dev preview too.
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "../utils/productJsonLd";

const LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "SAWO",
      url: SITE_URL,
      logo: `${SITE_URL}/logo512.png`,
      sameAs: [
        "https://www.facebook.com/SAWOsaunaworld",
        "https://www.instagram.com/sawosauna/",
        "https://ph.linkedin.com/company/sawo-inc",
        "https://www.youtube.com/@SAWOsauna",
        "https://www.tiktok.com/@sawosauna",
      ],
      contactPoint: [
        { "@type": "ContactPoint", contactType: "sales", email: "info@sawo.com" },
        { "@type": "ContactPoint", contactType: "customer support", email: "help@sawo.com" },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "SAWO",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function SiteJsonLd() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(LD)}</script>
    </Helmet>
  );
}
