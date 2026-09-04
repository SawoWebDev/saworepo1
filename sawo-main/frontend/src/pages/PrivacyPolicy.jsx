import React from "react";
import SEO from "../components/SEO";
import { useLocaleT, useLocalizedPath } from "../i18n/LocaleContext";

export default function PrivacyPolicy() {
  const t = useLocaleT("privacy");
  const localize = useLocalizedPath();
  const SECTIONS = t("sections", { returnObjects: true });

  return (
    <div style={{ fontFamily: "Montserrat, sans-serif", color: "#1a1a1a" }}>
      <SEO
        title={t("meta.title")}
        description={t("meta.description")}
        path={localize("/privacy-policy")}
        hreflangAlternates={{ en: "/privacy-policy", zh: "/zh/privacy-policy" }}
      />
      {/* Hero */}
      <section
        className="flex items-center justify-center text-center px-6 pb-20 pt-36"
        style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #3a2a1a 100%)", minHeight: "28vh" }}
      >
        <div>
          <p className="text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "#c4a882" }}>
            {t("hero.eyebrow")}
          </p>
          <h1
            className="font-bold uppercase"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "#ffffff", letterSpacing: "0.05em" }}
          >
            {t("hero.title")}
          </h1>
          <p className="mt-3 text-sm" style={{ color: "#a0a0a0" }}>
            {t("hero.websiteLabel")}{" "}
            <a href="https://sawo.com" className="hover:underline" style={{ color: "#c4a882" }}>
              https://sawo.com
            </a>
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        {SECTIONS.map((section, si) => (
          <div key={si} className="mb-10">
            <h2
              className="font-bold mb-4 pb-2"
              style={{
                fontSize: "1.15rem",
                letterSpacing: "0.04em",
                borderBottom: "2px solid #c4a882",
                textTransform: "uppercase",
              }}
            >
              {section.title}
            </h2>

            {/* Plain paragraphs */}
            {section.content?.map((para, pi) => (
              <p key={pi} className="mb-3 leading-relaxed text-sm" style={{ color: "#3a3a3a" }}>
                {para}
              </p>
            ))}

            {/* Email link */}
            {section.email && (
              <p className="mb-3 text-sm font-semibold">
                <a href={`mailto:${section.email}`} style={{ color: "#8b5e3c" }}>
                  {section.email}
                </a>
              </p>
            )}

            {/* Bullet list */}
            {section.bullets && (
              <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: "#3a3a3a" }}>
                {section.bullets.map((b, bi) => (
                  <li key={bi} className="leading-relaxed">{b}</li>
                ))}
              </ul>
            )}

            {/* Subsections */}
            {section.subsections?.map((sub, ssi) => (
              <div key={ssi} className="mb-5 mt-5">
                <h3
                  className="font-semibold mb-2"
                  style={{ fontSize: "0.95rem", color: "#5a3a1a", letterSpacing: "0.02em" }}
                >
                  {sub.subtitle}
                </h3>
                {sub.content?.map((para, pi) => (
                  <p key={pi} className="mb-2 leading-relaxed text-sm" style={{ color: "#3a3a3a" }}>
                    {para}
                  </p>
                ))}
                {sub.bullets && (
                  <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: "#3a3a3a" }}>
                    {sub.bullets.map((b, bi) => (
                      <li key={bi} className="leading-relaxed">{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ))}

        <p className="text-xs mt-12 pt-6 border-t" style={{ color: "#999", borderColor: "#e0e0e0" }}>
          {t("footer")}
        </p>
      </section>
    </div>
  );
}
