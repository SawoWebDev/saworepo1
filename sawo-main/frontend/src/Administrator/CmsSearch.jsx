// src/Administrator/CmsSearch.jsx
// Global quick-nav search shown on the right side of the admin page header.
// Type e.g. "Top Pages" and it resolves to the Analytics page (and jumps to
// that section on arrival) — see cmsSearch.js for the searchable index.
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { can } from "./permissions";
import { buildSearchIndex } from "./cmsSearch";

export default function CmsSearch({ role }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef(null);

  const index = useMemo(() => buildSearchIndex().filter(e => can(role, e.cap)), [role]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter(e =>
        e.label.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.keywords.some(k => k.includes(q))
      )
      .slice(0, 8);
  }, [query, index]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (entry) => {
    setQuery("");
    setOpen(false);
    navigate(entry.path);
    if (entry.anchor) {
      // Give the destination page a moment to mount before scrolling.
      setTimeout(() => {
        document.getElementById(entry.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); goTo(results[highlighted]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div className="cms-search" ref={wrapRef}>
      <i className="fa-solid fa-magnifying-glass cms-search-icon" />
      <input
        type="text"
        className="cms-search-input"
        placeholder="Search the CMS..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(0); }}
        onFocus={() => query && setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && query && (
        <div className="cms-search-results">
          {results.length === 0 ? (
            <div className="cms-search-empty">No matches for "{query}"</div>
          ) : (
            results.map((r, i) => (
              <button
                type="button"
                key={`${r.path}-${r.anchor || ""}-${r.label}`}
                className={`cms-search-result${i === highlighted ? " active" : ""}`}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => goTo(r)}
              >
                <div className="cms-search-result-label">{r.label}</div>
                <div className="cms-search-result-meta">
                  {r.section}{r.description ? ` · ${r.description}` : ""}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
