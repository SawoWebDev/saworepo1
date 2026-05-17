import React from "react";

const SECTIONS = [
  {
    title: "Who We Are",
    content: [
      "This Privacy Policy applies to the website operated by SAWO INC, accessible at https://sawo.com.",
    ],
  },
  {
    title: "What Personal Data We Collect and Why",
    subsections: [
      {
        subtitle: "Comments",
        content: [
          "When visitors leave comments on our site, we collect the data shown in the comments form, as well as the visitor's IP address and browser user agent string to assist in spam detection.",
          "An anonymized string (hash) generated from your email address may be sent to the Gravatar service to check if you're using it. The Gravatar privacy policy is available at https://automattic.com/privacy/. After your comment is approved, your profile picture may be visible publicly in the context of your comment.",
        ],
      },
      {
        subtitle: "Media",
        content: [
          "If you upload images to our website, please avoid including embedded location data (EXIF GPS), as other users can download and extract location information from uploaded images.",
        ],
      },
      {
        subtitle: "Cookies",
        bullets: [
          "If you leave a comment, you may choose to save your name, email, and website in cookies. These cookies last for one year and are meant for your convenience.",
          "A temporary cookie is set when visiting the login page to check if your browser accepts cookies. It contains no personal data and is discarded upon closing your browser.",
          "Upon logging in, several cookies are set to save login details and screen display preferences. Login cookies last two days, and screen preference cookies last a year. Selecting \"Remember Me\" extends your login for two weeks.",
          "If you log out, login cookies are removed.",
          "Editing or publishing an article will set a cookie that contains the post ID of the article. This cookie expires after one day.",
        ],
      },
      {
        subtitle: "Embedded Content from Other Websites",
        content: [
          "Articles on this site may include embedded content (e.g., videos, images, articles, etc.). Embedded content behaves the same way as if you visited the source website directly. These external sites may collect data about you, use cookies, and track your interaction with their content — especially if you're logged in to their platform.",
        ],
      },
      {
        subtitle: "Analytics",
        content: [
          "We may use third-party analytics tools to measure traffic and usage trends. These tools collect data sent by your browser, including the pages visited and usage behavior, to help improve our services.",
        ],
      },
    ],
  },
  {
    title: "Who We Share Your Data With",
    content: [
      "If you request a password reset, your IP address will be included in the reset email.",
    ],
  },
  {
    title: "How Long We Retain Your Data",
    bullets: [
      "Comments and their metadata are retained indefinitely to automatically recognize and approve follow-up comments.",
      "For users who register on our site (if applicable), we store the personal information provided in their user profile. All users can view, edit, or delete their personal information at any time (except their username). Website administrators can also access and manage that data.",
    ],
  },
  {
    title: "Your Rights Over Your Data",
    content: [
      "If you have an account or have left comments, you can request an exported file of your personal data we hold, including any data you've provided. You may also request that we erase your personal data, except for data we are required to retain for administrative, legal, or security purposes.",
    ],
  },
  {
    title: "Where We Send Your Data",
    content: [
      "Visitor comments may be checked through an automated spam detection service.",
    ],
  },
  {
    title: "Contact Information",
    content: [
      "For privacy-related concerns or data requests, please contact us at:",
    ],
    email: "info@sawo.com",
  },
  {
    title: "Additional Information",
    subsections: [
      {
        subtitle: "How We Protect Your Data",
        content: [
          "We implement appropriate technical and organizational measures including encryption, firewalls, and access controls to safeguard your personal data.",
        ],
      },
      {
        subtitle: "Data Breach Procedures",
        content: [
          "In case of a data breach, we will notify affected users and regulatory authorities as required by law, and take immediate action to secure user data.",
        ],
      },
      {
        subtitle: "Third Parties We Receive Data From",
        content: [
          "We may receive data from trusted third-party services for spam protection, analytics, and login services.",
        ],
      },
      {
        subtitle: "Automated Decision-Making and Profiling",
        content: [
          "We do not use your data for automated decision-making or profiling that results in legal or similarly significant effects.",
        ],
      },
      {
        subtitle: "Industry Regulatory Disclosure Requirements",
        content: [
          "We comply with applicable data protection laws, including those related to user consent, data retention, and lawful processing.",
        ],
      },
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div style={{ fontFamily: "Montserrat, sans-serif", color: "#1a1a1a" }}>
      {/* Hero */}
      <section
        className="flex items-center justify-center text-center px-6 pb-20 pt-36"
        style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #3a2a1a 100%)", minHeight: "28vh" }}
      >
        <div>
          <p className="text-sm tracking-[0.2em] uppercase mb-3" style={{ color: "#c4a882" }}>
            Legal
          </p>
          <h1
            className="font-bold uppercase"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "#ffffff", letterSpacing: "0.05em" }}
          >
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm" style={{ color: "#a0a0a0" }}>
            Website:{" "}
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
          Last updated: 2026 · SAWO INC · All rights reserved.
        </p>
      </section>
    </div>
  );
}
