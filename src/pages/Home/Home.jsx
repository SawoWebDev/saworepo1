import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Hero from "./Hero";
import Section1 from "./Section1";
import Section2 from "./Section2";
import Section3 from "./Section3";
import Section4 from "./Section4";
import Section5 from "./Section5";

const Home = () => {
  return (
    <div>
      <Hero />

      {/* Section 1 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section1 />
      </div>

      {/* Section 2 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section2 />

        {/* Explore More Button */}
        <div className="text-center mt-6">
          <a
            href="https://www.sawo.com/sawo-products/finnish-sauna/sauna-heaters/"
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
          </a>
        </div>
      </div>

      {/* Section 3 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section3 />
      </div>
      {/* Section 4 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section4 />
      </div>
      {/* Section 5 */}
      <div className="max-w-[2000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <Section5 />
      </div>
    </div>
  );
};

export default Home;

