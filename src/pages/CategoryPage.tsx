import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import CategoryOverlayHeader from "../components/CategoryOverlayHeader";
import CategoryIconFrame from "../components/CategoryIconFrame";
import "../components/CategoryNav.css";

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>();

  const category = useMemo(() => categories.find((c) => c.id === categoryId), [categoryId]);
  const list = useMemo(() => getProductsByCategory(categoryId, subcategoryId), [categoryId, subcategoryId]);
  const subcategories = useMemo(() => (categoryId === "other" ? getOtherSubcategoryCounts() : []), [categoryId]);

  useEffect(() => {
    setListContext({ type: "category", categoryId });
    setSubcategoryId(undefined);
  }, [categoryId, setListContext]);

  const isOther = categoryId === "other";
  const selectedSub = useMemo(() => subcategories.find((s) => s.id === subcategoryId), [subcategories, subcategoryId]);

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6">
      {/* 1. Standardized Single-Row Overlay Header */}
      <CategoryOverlayHeader
        categoryId={isOther && subcategoryId ? subcategoryId : categoryId}
        title={
          isOther && subcategoryId
            ? selectedSub?.name[lang] || ""
            : category?.name[lang] || ""
        }
        productCount={(!isOther || subcategoryId) ? list.length : undefined}
        to="/"
        onBack={isOther && subcategoryId ? () => setSubcategoryId(undefined) : undefined}
      />

      {/* 2. Subcategories list for "Other" when no subcategory is selected */}
      {isOther && !subcategoryId && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
          {subcategories.map((sub) => (
            <button
              type="button"
              key={sub.id}
              onClick={() => setSubcategoryId(sub.id)}
              className="glass ks-other-sub-card ks-category-tile group flex h-full min-h-[90px] flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center cursor-pointer sm:min-h-[105px] sm:p-3.5"
              aria-label={sub.name[lang]}
            >
              <CategoryIconFrame id={sub.id} size={26} className="h-12 w-12 sm:h-14 sm:w-14" />
              <span
                className="line-clamp-2 text-xs font-bold leading-5 sm:text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {sub.name[lang]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Product grid when on primary category or inside a subcategory of Other */}
      {(!isOther || subcategoryId) && (
        <>
          {list.length === 0 ? (
            <p className="py-16 text-center text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("search.noResults")}
            </p>
          ) : (
            <div className="ks-category-product-grid">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} minimal hidePrice />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
