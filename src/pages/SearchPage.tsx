import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { searchProducts } from "../data/products";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const results = searchProducts(query, lang);

  useEffect(() => {
    setListContext({ type: "search", query });
  }, [query, setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/" label={t("search.back")} />
        <span />
      </div>

      <h1 className="mb-1 text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
        {t("search.resultsFor")} «{query}»
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
        {results.length} {t("search.resultsCount")}
      </p>

      {results.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {t("search.noResults")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} minimal />
          ))}
        </div>
      )}
    </div>
  );
}
