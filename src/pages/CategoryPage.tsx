import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getOtherSubcategoryCounts, getListableProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import CategoryOverlayHeader from "../components/CategoryOverlayHeader";
import CategoryIconFrame from "../components/CategoryIconFrame";
import "../components/CategoryNav.css";

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  // Subcategory selection: URL-first (?sub=…) so links from the home category
  // rows / search shortcut land inside the subcategory directly. The local
  // state below handles in-page back navigation.
  const subParam = searchParams.get("sub") || undefined;
  const [localSub, setLocalSub] = useState<string | undefined>();
  const subcategoryId = subParam ?? localSub;

  const category = useMemo(() => categories.find((c) => c.id === categoryId), [categoryId]);
  // Customer grids show only products that have a real usable image.
  const list = useMemo(() => getListableProductsByCategory(categoryId, subcategoryId), [categoryId, subcategoryId]);
  const subcategories = useMemo(() => (categoryId === "other" ? getOtherSubcategoryCounts() : []), [categoryId]);

  useEffect(() => {
    setListContext({ type: "category", categoryId });
    setLocalSub(undefined);
  }, [categoryId, setListContext]);

  const isOther = categoryId === "other";
  const selectedSub = useMemo(() => subcategories.find((s) => s.id === subcategoryId), [subcategories, subcategoryId]);

  // "Back" from a ?sub= deep link clears the URL param instead of the local state.
  const backFromSub = () => {
    if (subParam) {
      searchParams.delete("sub");
      setSearchParams(searchParams, { replace: true });
    } else {
      setLocalSub(undefined);
    }
  };

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
        onBack={isOther && subcategoryId ? backFromSub : undefined}
      />

      {/* 2. Subcategories list for "Other" when no subcategory is selected */}
      {isOther && !subcategoryId && (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
          {subcategories.map((sub) => (
            <button
              type="button"
              key={sub.id}
              onClick={() => setLocalSub(sub.id)}
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
