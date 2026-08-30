import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import CategoryOverlayHeader from "../components/CategoryOverlayHeader";
import CategoryIcon from "../components/CategoryIcon";
import "../components/CategoryNav.css";

const PROMINENT_SUB_IDS = ["powder-sponge-holder", "colander-bowl", "soap-dish"] as const;

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>();

  const category = useMemo(() => categories.find((c) => c.id === categoryId), [categoryId]);
  const list = useMemo(() => getProductsByCategory(categoryId, subcategoryId), [categoryId, subcategoryId]);
  const subcategories = useMemo(() => (categoryId === "other" ? getOtherSubcategoryCounts() : []), [categoryId]);

  const top3Subcategories = useMemo(() => {
    return PROMINENT_SUB_IDS
      .map((id) => subcategories.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }, [subcategories]);

  const remainingSubcategories = useMemo(() => {
    return subcategories.filter((s) => !PROMINENT_SUB_IDS.includes(s.id as any));
  }, [subcategories]);

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
        <div className="flex flex-col gap-6">
          {/* Top 3 Spotlight Subcategories: 3 equal cards in 1 row on desktop */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
            {top3Subcategories.map((sub, index) => (
              <button
                type="button"
                key={sub.id}
                onClick={() => setSubcategoryId(sub.id)}
                className="ks-category-tile animate-fade-up group flex h-full min-h-[95px] flex-col items-center justify-center p-3 text-center cursor-pointer sm:min-h-[115px] sm:p-4"
                style={{ animationDelay: `${index * 0.05}s` }}
                aria-label={sub.name[lang]}
              >
                <div className="ks-category-icon-wrapper h-7 w-7 sm:h-9 sm:w-9 lg:h-10 lg:w-10">
                  <CategoryIcon id={sub.id} size={30} className="h-full w-full object-contain" />
                </div>
                <span className="ks-category-label">{sub.name[lang]}</span>
              </button>
            ))}
          </div>

          {/* Remaining Subcategories Grid */}
          <div className="flex flex-col gap-2.5">
            <h3 className="px-1 text-xs font-bold sm:text-sm" style={{ color: "var(--text-muted)" }}>
              {t("category.otherSubcategories") || "سایر زیردسته‌ها"}
            </h3>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
              {remainingSubcategories.map((sub) => (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => setSubcategoryId(sub.id)}
                  className="glass ks-other-sub-card group flex h-full min-h-[90px] flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-[0_0_14px_var(--accent-glow)] active:scale-95 cursor-pointer sm:min-h-[105px] sm:p-3.5"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border-soft)",
                    boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10"
                    style={{
                      background: "var(--chip-bg)",
                      color: "var(--accent-1)",
                    }}
                  >
                    <CategoryIcon id={sub.id} size={22} />
                  </div>
                  {/* Product name only per requirement - NO product count under the card */}
                  <span
                    className="line-clamp-2 text-xs font-bold leading-5 sm:text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {sub.name[lang]}
                  </span>
                </button>
              ))}
            </div>
          </div>
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
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 md:grid-cols-4">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} minimal />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
