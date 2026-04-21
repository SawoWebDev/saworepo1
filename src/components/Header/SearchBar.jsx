import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchProducts } from "../../local-storage/cacheReader";
import menuPaths from "../../menuPaths";

const PAGE_RESULTS = [
  { name: "Home", path: menuPaths.home, category: "Pages" },
  { name: "Sauna Heaters", path: menuPaths.sauna.heaters.parent, category: "Pages" },
  { name: "Sauna Controls", path: menuPaths.sauna.controls, category: "Pages" },
  { name: "Sauna Accessories", path: menuPaths.sauna.accessories, category: "Pages" },
  { name: "Steam Generators", path: menuPaths.steam.generators, category: "Pages" },
  { name: "Steam Controls", path: menuPaths.steam.controls, category: "Pages" },
  { name: "Steam Accessories", path: menuPaths.steam.accessories, category: "Pages" },
  { name: "Infrared", path: menuPaths.infrared, category: "Pages" },
  { name: "FAQ", path: menuPaths.support.faq, category: "Pages" },
  { name: "Product Catalogue", path: menuPaths.support.catalogue, category: "Pages" },
  { name: "User Manuals", path: menuPaths.support.manuals, category: "Pages" },
  { name: "Contact Us", path: menuPaths.contact, category: "Pages" },
  { name: "About Us", path: menuPaths.about.parent, category: "Pages" },
  { name: "Careers", path: menuPaths.careers, category: "Pages" },
];

export default function SearchBar({ isNavIcon = false, isExpanded = false, isInline = false, onToggle = null, onBlur = null }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        setHighlightedIndex(-1);
        return;
      }

      setLoading(true);
      const q = query.toLowerCase().trim();

      // Search products
      const productResults = await searchProducts(query);

      // Search pages
      const pageResults = PAGE_RESULTS.filter(
        (page) =>
          page.name.toLowerCase().includes(q) ||
          page.path.toLowerCase().includes(q)
      );

      // Combine results
      const combined = [
        ...productResults.map((p) => ({
          ...p,
          category: "Products",
          resultType: "product",
        })),
        ...pageResults.map((p) => ({
          ...p,
          resultType: "page",
        })),
      ];

      setResults(combined);
      setHighlightedIndex(-1);
      setLoading(false);
    };

    const timer = setTimeout(handleSearch, 300); // Debounce
    return () => clearTimeout(timer);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter") setIsOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          selectResult(results[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        if (isInline && onBlur) {
          onBlur();
        } else if (isExpanded && onToggle) {
          onToggle();
        }
        break;
      default:
        break;
    }
  };

  // Navigate to result
  const selectResult = (result) => {
    const targetPath = result.resultType === "product"
      ? `/products/${result.slug}`
      : result.path || "/";
    navigate(targetPath);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  // Close on outside click
  useEffect(() => {
    if (!isExpanded && !isInline) return;

    const handleClickOutside = (event) => {
      // Allow clicks to propagate first (for button clicks to register)
      setTimeout(() => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
          // Check if clicking on the search container
          const searchContainer = document.getElementById("search-container");
          if (searchContainer && searchContainer.contains(event.target)) {
            return; // Allow toggling with the icon
          }

          if (isInline && onBlur) {
            onBlur();
          } else if (isExpanded && onToggle) {
            onToggle();
          }
        }
      }, 0);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, isInline, onToggle, onBlur]);

  // Nav Icon mode: just the search icon that looks like part of nav
  if (isNavIcon) {
    return (
      <button
        onClick={() => onToggle && onToggle()}
        className="flex items-center gap-1 transition-colors text-[rgb(51,51,51)] hover:text-[#af8564]"
        aria-label="Search"
      >
        <i className="fa-solid fa-search text-[16px]"></i>
      </button>
    );
  }

  // Inline mode: search input in header row
  if (isInline) {
    return (
      <div ref={searchRef} className="relative w-full" onBlur={() => onBlur && onBlur()}>
        <div className="relative flex items-center">
          <i className="fa-solid fa-search absolute left-3 text-gray-400 text-sm pointer-events-none"></i>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#af8564] focus:border-transparent"
          />
        </div>

        {/* Dropdown Results below input */}
        {isOpen && (query || results.length > 0) && (
          <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-full py-3 px-2 max-h-96 overflow-y-auto">
            {loading && (
              <div className="px-4 py-2 text-center text-gray-500 text-xs">
                Searching...
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="px-4 py-2 text-center text-gray-500 text-xs">
                No results found
              </div>
            )}

            {!loading && results.length > 0 && (
              <div>
                {results.map((result, globalIdx) => (
                  <button
                    key={`${result.category}-${result.slug || result.path}`}
                    onClick={() => selectResult(result)}
                    onMouseEnter={() => setHighlightedIndex(globalIdx)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] rounded-lg transition-colors flex items-center gap-2 ${
                      highlightedIndex === globalIdx
                        ? "bg-[#af8564] text-white font-semibold"
                        : "text-[rgb(51,51,51)] hover:bg-[#af8564] hover:text-white"
                    }`}
                  >
                    {result.resultType === "product" &&
                      result.thumbnail && (
                        <img
                          src={result.thumbnail}
                          alt={result.name}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      )}
                    <p className="truncate font-medium">
                      {result.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Expanded mode: dropdown style (like header menus)
  if (isExpanded) {
    return (
      <div ref={searchRef} className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-64 py-3 px-2">
        {/* Search Input - styled like nav item */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products, pages..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-4 py-2.5 text-[13px] rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#af8564] focus:border-transparent"
        />

        {/* Dropdown Results */}
        {(query || results.length > 0) && (
          <div className="max-h-80 overflow-y-auto mt-2">
            {loading && (
              <div className="px-4 py-2 text-center text-gray-500 text-xs">
                Searching...
              </div>
            )}

            {!loading && results.length === 0 && query && (
              <div className="px-4 py-2 text-center text-gray-500 text-xs">
                No results found
              </div>
            )}

            {!loading && results.length > 0 && (
              <div>
                {results.map((result, globalIdx) => (
                  <button
                    key={`${result.category}-${result.slug || result.path}`}
                    onClick={() => selectResult(result)}
                    onMouseEnter={() => setHighlightedIndex(globalIdx)}
                    className={`w-full text-left px-4 py-2.5 text-[13px] rounded-lg transition-colors flex items-center gap-2 ${
                      highlightedIndex === globalIdx
                        ? "bg-[#af8564] text-white font-semibold"
                        : "text-[rgb(51,51,51)] hover:bg-[#af8564] hover:text-white"
                    }`}
                  >
                    {result.resultType === "product" &&
                      result.thumbnail && (
                        <img
                          src={result.thumbnail}
                          alt={result.name}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      )}
                    <p className="truncate font-medium">
                      {result.name}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
