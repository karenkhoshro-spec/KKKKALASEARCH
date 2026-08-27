import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories, othersSubCategories } from "../data/categories";
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

  const isOthers = categoryId === "others";

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

      {/* Implementation 13: Show sub-categories inside Others (not independent) */}
      {isOthers && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {lang === "fa" ? "زیر دسته‌ها در سایر:" : lang === "ar" ? "الفئات الفرعية في أخرى:" : "Sub-categories in Others:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {othersSubCategories.map((sub) => (
              <span
                key={sub.id}
                className="glass rounded-xl px-3 py-1.5 text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {sub.name[lang]}
              </span>
            ))}
          </div>
        </div>
      )}

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
