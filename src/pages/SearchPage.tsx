import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { findRelatedCategoryForQuery, searchProducts } from "../data/products";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();

  // Results stay inside the search overlay — never redirected to a category screen.
  const results = useMemo(() => searchProducts(query, lang), [query, lang]);
  const related = useMemo(() => findRelatedCategoryForQuery(query), [query]);

  useEffect(() => {
    setListContext({ type: "search", query });
  }, [query, setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between" style={{ direction: "ltr" }}>
        <BackButton to="/" label={t("search.back")} />
        <span />
      </div>

      <h1 className="ks-page-title mb-1" style={{ color: "var(--text-primary)" }}>
        <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>{t("search.resultsFor")}</span> {query}
      </h1>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t("search.resultsHint")} · {results.length} {t("search.resultsCount")}
        </p>
        {related && (
          <Link
            to={related.path}
            className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors hover:bg-white/10"
            style={{ color: "var(--accent-1)" }}
          >
            <span aria-hidden="true">{related.icon}</span>
            {t("search.relatedCategory")}: {related.name[lang]}
          </Link>
        )}
      </div>

      {results.length === 0 ? (
        <p className="py-16 text-center text-base" style={{ color: "var(--text-muted)" }}>
          {t("search.noResults")}
        </p>
      ) : (
        <div className="ks-product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} minimal />
          ))}
        </div>
      )}
    </div>
  );
}
