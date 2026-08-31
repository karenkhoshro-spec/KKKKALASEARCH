import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const category = categories.find((c) => c.id === categoryId);
  const list = getProductsByCategory(categoryId);

  useEffect(() => {
    setListContext({ type: "category", categoryId });
  }, [categoryId, setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/" label={t("category.back")} />
        <h1 className="flex items-center gap-2 text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
          <span>{category?.icon}</span>
          {category ? category.name[lang] : ""}
        </h1>
        <span />
      </div>

      <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>
        {list.length} {t("category.productsCount")}
      </p>

      {list.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          {t("search.noResults")}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
