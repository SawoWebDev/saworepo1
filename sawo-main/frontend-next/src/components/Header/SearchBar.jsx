'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/translation/navigation';
import paths from '@/translation/routing';
import { searchProducts } from '@/lib/search';

// Localized page index — labels come from the nav catalog so search results
// are translated too. Mirrors the main site's PAGE_RESULTS.
function usePageResults() {
  const t = useTranslations('nav');
  return [
    { name: t('home'), path: paths.home },
    { name: t('items.saunaHeaters'), path: paths.sauna.heaters.parent },
    { name: t('items.saunaControls'), path: paths.sauna.controls },
    { name: t('items.saunaAccessories'), path: paths.sauna.accessories.parent },
    { name: t('items.steamGenerators'), path: paths.steam.generators },
    { name: t('items.steamControls'), path: paths.steam.controls },
    { name: t('items.steamAccessories'), path: paths.steam.accessories },
    { name: t('items.infrared'), path: paths.infrared },
    { name: t('items.faq'), path: paths.support.faq },
    { name: t('items.productCatalogue'), path: paths.support.catalogue },
    { name: t('items.userManuals'), path: paths.support.manuals },
    { name: t('contactUs'), path: paths.contact },
    { name: t('aboutUs'), path: paths.about.parent },
    { name: t('items.careers'), path: paths.careers },
  ];
}

function ResultRow({ result, idx, highlightedIndex, setHighlightedIndex, selectResult }) {
  const active = highlightedIndex === idx;
  return (
    <button
      type="button"
      onClick={() => selectResult(result)}
      onMouseEnter={() => setHighlightedIndex(idx)}
      className={`w-full text-left px-4 py-2.5 text-[13px] rounded-lg transition-colors flex items-center gap-2 ${
        active ? 'bg-[#af8564] text-white font-semibold' : 'text-[rgb(51,51,51)] hover:bg-[#af8564] hover:text-white'
      }`}
    >
      {result.resultType === 'product' && result.thumbnail ? (
        <img src={result.thumbnail} alt={result.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
      ) : (
        <i className={`fa-solid fa-${result.resultType === 'page' ? 'link' : 'box'} text-xs flex-shrink-0 opacity-60`} />
      )}
      <p className="truncate font-medium">{result.name}</p>
    </button>
  );
}

function ResultList({ results, loading, query, labels, ...rowProps }) {
  if (loading) return <div className="px-4 py-2 text-center text-gray-500 text-xs">{labels.searching}</div>;
  if (!loading && results.length === 0 && query) {
    return <div className="px-4 py-2 text-center text-gray-500 text-xs">{labels.noResults}</div>;
  }
  if (results.length === 0) return null;

  const pages = results.filter((r) => r.resultType === 'page');
  const products = results.filter((r) => r.resultType === 'product').slice(0, 8);

  return (
    <div>
      {pages.length > 0 && (
        <p className="px-4 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{labels.pages}</p>
      )}
      {pages.map((result, idx) => (
        <ResultRow key={`page-${result.path}`} result={result} idx={idx} {...rowProps} />
      ))}
      {products.length > 0 && (
        <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{labels.products}</p>
      )}
      {products.map((result, idx) => (
        <ResultRow key={`product-${result.slug}`} result={result} idx={pages.length + idx} {...rowProps} />
      ))}
    </div>
  );
}

export default function SearchBar({ onClose }) {
  const t = useTranslations('nav');
  const router = useRouter();
  const pageResults = usePageResults();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  const labels = {
    searching: t('searchBox.searching'),
    noResults: t('searchBox.noResults'),
    pages: t('searchBox.pages'),
    products: t('searchBox.products'),
  };

  useEffect(() => {
    const handleSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        setHighlightedIndex(-1);
        return;
      }
      setLoading(true);
      const q = query.toLowerCase().trim();
      const productResults = await searchProducts(query);
      const pages = pageResults.filter(
        (page) => page.name.toLowerCase().includes(q) || page.path.toLowerCase().includes(q)
      );
      setResults([
        ...productResults.map((p) => ({ ...p, resultType: 'product' })),
        ...pages.map((p) => ({ ...p, resultType: 'page' })),
      ]);
      setHighlightedIndex(-1);
      setLoading(false);
    };
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const selectResult = (result) => {
    const target = result.resultType === 'product' ? `/products/${result.slug}` : result.path || '/';
    router.push(target);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) selectResult(results[highlightedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      onClose?.();
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative flex items-center">
        <i className="fa-solid fa-search absolute left-3 text-gray-400 text-sm pointer-events-none"></i>
        <input
          ref={inputRef}
          type="text"
          placeholder={t('searchBox.placeholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#af8564] focus:border-transparent"
        />
      </div>

      {isOpen && (query || results.length > 0) && (
        <div
          className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 w-full py-3 px-2 max-h-96 overflow-y-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          <ResultList
            results={results}
            loading={loading}
            query={query}
            labels={labels}
            highlightedIndex={highlightedIndex}
            setHighlightedIndex={setHighlightedIndex}
            selectResult={selectResult}
          />
        </div>
      )}
    </div>
  );
}
