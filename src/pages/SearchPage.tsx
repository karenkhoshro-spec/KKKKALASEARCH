import { useDeferredValue, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Sparkles, Search, Tag } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { searchProducts } from "../data/products";
import { goBack } from "../utils/safeBack";
import { categories } from "../data/categories";
import ProductCard from "../components/ProductCard";
import OverlayHeader from "../components/OverlayHeader";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const navigate = useNavigate();
  const { t, lang, dir } = useLanguage();
  const { setListContext } = useListContext();


  // Perf: keep typing responsive — the full-catalog scan runs at deferred priority
  const deferredQuery = useDeferredValue(query);
  const results = searchProducts(deferredQuery, lang);

  useEffect(() => {
    setListContext({ type: "search", query });
  }, [query, setListContext]);

  // Identify if query directly corresponds to a known primary category
  const matchedCategory = categories.find(
    (c) =>
      c.name.fa.includes(query.trim()) ||
      (query.trim().length >= 3 && c.name.fa.toLowerCase().includes(query.trim().toLowerCase()))
  );

  const handleBack = () => {
    goBack(navigate);
  };

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6" dir={dir}>
      <OverlayHeader
        onBack={handleBack}
        leading={
          <span
            className="glass rounded-full px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:text-xs"
            style={{
              background: "var(--chip-bg)",
              color: "var(--accent-1)",
              border: "1px solid var(--border-soft)",
            }}
          >
            {results.length} {t("search.resultsCount") || "نتیجه"}
          </span>
        }
      />

      {query ? (
        <div className="mb-6 flex justify-center">
          <div
            className="glass-strong w-full max-w-2xl rounded-2xl px-4 py-4 text-center sm:px-8 sm:py-5"
            style={{
              border: "1.5px solid var(--border-strong)",
              background: "var(--surface-strong)",
              boxShadow: "0 8px 28px rgba(0, 0, 0, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.18)",
            }}
          >
            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
              <Search size={18} />
            </div>
            <h1 className="text-base font-black leading-snug sm:text-xl md:text-2xl" style={{ color: "var(--text-primary)" }}>
              {t("search.resultsFor")} «{query}»
            </h1>
          </div>
        </div>
      ) : null}

      {/* 2. Known category indicator badge if query matches a category */}
      {matchedCategory && (
        <div className="mb-4 flex items-center gap-2">
          <Link
            to={`/category/${matchedCategory.id}`}
            className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
            style={{
              background: "var(--surface-strong)",
              borderColor: "var(--accent-1)",
              color: "var(--accent-1)",
            }}
          >
            <Tag size={13} />
            <span>مشاهده دسته کامل «{matchedCategory.name[lang]}» ↗</span>
          </Link>
        </div>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles size={32} className="mb-2 text-violet-400 opacity-60" />
          <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("search.noResults")}
          </p>
        </div>
      ) : (
        <div className="ks-category-product-grid">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} hidePrice />
          ))}
        </div>
      )}
    </div>
  );
}
