import { useDeferredValue, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Sparkles, Search, ArrowRight, ArrowLeft, Tag } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { searchProducts } from "../data/products";
import { categories } from "../data/categories";
import ProductCard from "../components/ProductCard";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const navigate = useNavigate();
  const { t, lang, dir } = useLanguage();
  const { setListContext } = useListContext();
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

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
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6">
      {/* 1. Standardized Overlay Header with Back button on the LEFT */}
      <div
        className="mb-5 flex w-full items-center justify-between border-b pb-3.5"
        style={{ borderColor: "var(--border-soft)", direction: "ltr" }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label={t("category.back") || "بازگشت"}
          className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--border-strong)",
            background: "var(--surface-strong)",
          }}
        >
          <ArrowIcon size={16} style={{ color: "var(--accent-1)" }} />
          <span dir={dir}>{t("category.back") || "بازگشت"}</span>
        </button>

        <div className="flex items-center gap-2.5" dir={dir} style={{ color: "var(--text-primary)" }}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
            <Search size={18} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-base font-extrabold sm:text-lg">
              {t("search.resultsFor")} «{query}»
            </h1>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{
                background: "var(--chip-bg)",
                color: "var(--accent-1)",
                border: "1px solid var(--border-soft)",
              }}
            >
              {results.length} {t("search.resultsCount") || "نتیجه"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Known category indicator badge if query matches a category */}
      {matchedCategory && (
        <div className="mb-4 flex items-center gap-2" dir={dir}>
          <Link
            to={`/category/${matchedCategory.id}`}
            className="glass inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:scale-105"
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

      {/* 3. Search Results: Name-Only Diamond Crystal Cards */}
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles size={32} className="mb-2 text-violet-400 opacity-60" />
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
