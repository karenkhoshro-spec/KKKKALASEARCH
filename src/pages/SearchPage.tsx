import { useDeferredValue, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { X, Sparkles, Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { searchProducts } from "../data/products";
import ProductCard from "../components/ProductCard";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  // Perf: keep typing responsive — the full-catalog scan runs at deferred priority
  const deferredQuery = useDeferredValue(query);
  const results = searchProducts(deferredQuery, lang);

  useEffect(() => {
    setListContext({ type: "search", query });
  }, [query, setListContext]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      {/* Search overlay header with elegant crystal close button */}
      <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-soft)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
            <Search size={17} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold sm:text-xl" style={{ color: "var(--text-primary)" }}>
              {t("search.resultsFor")} «{query}»
            </h1>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {results.length} {t("search.resultsCount")}
            </p>
          </div>
        </div>

        {/* Elegant small crystal close X button */}
        <Link
          to="/"
          aria-label="بستن"
          className="ks-crystal-close-btn flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "var(--surface-strong)",
            border: "1px solid var(--border-soft)",
            color: "var(--text-primary)",
          }}
        >
          <X size={18} />
        </Link>
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles size={28} className="mb-2 text-violet-400 opacity-60" />
          <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("search.noResults")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} minimal />
          ))}
        </div>
      )}
    </div>
  );
}
