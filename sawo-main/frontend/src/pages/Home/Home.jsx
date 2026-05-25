import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Hero from "./Hero";
import Section1 from "./Section1";
import Section2 from "./Section2";
import Section3 from "./Section3";
import Section4 from "./Section4";
import Section5 from "./Section5";
import menuPaths from "../../menuPaths";
import { getSiteContent } from "../../local-storage/cacheReader";

const Home = () => {
  // Fetch home page content once and pass it to all sections as a prop.
  // Each section reads its own slice (e.g. content.section1) and falls back
  // to its hardcoded defaults when the value is null or not yet synced.
  const [content, setContent] = useState({});

  useEffect(() => {
    getSiteContent("home")
      .then(data => setContent(data || {}))
      .catch(() => {}); // silently fall back to hardcoded defaults
  }, []);

  return (
    <div>
      <Hero content={content.hero} />

      {/* Section 1 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section1 content={content.section1} />
      </div>

      {/* Section 2 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section2 content={content.section2} />

        {/* Explore More Button */}
        <div className="text-center mt-6">
          <Link
            to={menuPaths.sauna.heaters.parent}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 500,
              fontSize: "15px",
              lineHeight: "27px",
              color: "#333333",
              textDecoration: "none",
              transition: "color 0.3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#af8564")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#333333")}
          >
            Explore More
            <FontAwesomeIcon icon={faChevronRight} />
          </Link>
        </div>
      </div>

      {/* Section 3 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section3 content={content.section3} />
      </div>
      {/* Section 4 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section4 content={content.section4} />
      </div>
      {/* Section 5 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section5 content={content.section5} />
      </div>
    </div>
  );
};

export default Home;
