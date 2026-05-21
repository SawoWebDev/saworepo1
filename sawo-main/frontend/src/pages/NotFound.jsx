import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import menuPaths from "../menuPaths";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Track 404 errors in analytics
    try {
      window.gtag?.('event', 'page_not_found', {
        page_path: location.pathname,
        page_title: '404 - Page Not Found'
      });
    } catch (e) {
      console.log('Analytics tracking skipped');
    }
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-white px-6 py-12">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#af8564]/10 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#af8564]/5 rounded-full blur-3xl opacity-50"></div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full text-center">

        {/* 404 Large Text */}
        <div className="mb-4">
          <h1 className="text-8xl md:text-9xl font-bold text-[#af8564] opacity-20 mb-2">
            404
          </h1>
        </div>

        {/* Main heading */}
        <h2 className="text-4xl md:text-5xl font-bold text-[#333] mb-4">
          Oops! Page Not Found
        </h2>

        {/* Description */}
        <p className="text-lg text-[#666] mb-2">
          We're sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <p className="text-sm text-[#999] mb-8">
          Tried to access: <code className="bg-gray-100 px-2 py-1 rounded text-[#333]">{location.pathname}</code>
        </p>

        {/* Helpful message */}
        <div className="bg-[#f5f1ed] border-l-4 border-[#af8564] p-4 mb-8 text-left rounded">
          <p className="text-[#333] font-medium mb-2">Here's what you can do:</p>
          <ul className="text-[#666] text-sm space-y-1">
            <li>✓ Check the URL for typos</li>
            <li>✓ Browse our product catalog</li>
            <li>✓ Use the search function below</li>
            <li>✓ Contact us for assistance</li>
          </ul>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            to={menuPaths.home}
            className="inline-block bg-[#af8564] hover:bg-[#96704f] text-white font-semibold py-3 px-6 rounded transition-colors"
          >
            Go to Home
          </Link>
          <Link
            to={menuPaths.sauna.heaters.parent}
            className="inline-block bg-[#f5f1ed] hover:bg-[#e8e1da] text-[#333] font-semibold py-3 px-6 rounded transition-colors border border-[#ddd]"
          >
            Browse Products
          </Link>
        </div>

        {/* Additional helpful links */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[#333] mb-4">
            Popular Sections:
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to={menuPaths.sauna.heaters.parent} className="text-[#af8564] hover:underline text-sm">
              Sauna Heaters
            </Link>
            <span className="text-[#ddd]">|</span>
            <Link to={menuPaths.steam.generators} className="text-[#af8564] hover:underline text-sm">
              Steam Generators
            </Link>
            <span className="text-[#ddd]">|</span>
            <Link to={menuPaths.support.faq} className="text-[#af8564] hover:underline text-sm">
              FAQ
            </Link>
            <span className="text-[#ddd]">|</span>
            <Link to={menuPaths.contact} className="text-[#af8564] hover:underline text-sm">
              Contact Us
            </Link>
          </div>
        </div>

        {/* Support section */}
        <div className="border-t border-[#ddd] pt-8">
          <p className="text-[#666] mb-4">
            Still having trouble? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <a
              href="mailto:help@sawo.com"
              className="text-[#af8564] hover:underline font-medium"
            >
              help@sawo.com
            </a>
            <span className="hidden sm:inline text-[#ddd]">|</span>
            <a
              href="tel:+63323412233"
              className="text-[#af8564] hover:underline font-medium"
            >
              +63 (32) 341-2233
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
