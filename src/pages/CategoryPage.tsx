import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import CategoryOverlayHeader from "../components/CategoryOverlayHeader";
import CategoryIcon from "../components/CategoryIcon";

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>();

  const category = useMemo(() => categories.find((c) => c.id === categoryId), [categoryId]);
  const list = useMemo(() => getProductsByCategory(categoryId, subcategoryId), [categoryId, subcategoryId]);
  const subcategories = useMemo(() => (categoryId === "other" ? getOtherSubcategoryCounts() : []), [categoryId]);

  const top3Subcategories = useMemo(() => subcategories.slice(0, 3), [subcategories]);
  const remainingSubcategories = useMemo(() => subcategories.slice(3), [subcategories]);

  useEffect(() => {
    setListContext({ type: "category", categoryId });
    setSubcategoryId(undefined);
  }, [categoryId, setListContext]);

  const isOther = categoryId === "other";
  const selectedSub = useMemo(() => subcategories.find((s) => s.id === subcategoryId), [subcategories, subcategoryId]);

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6">
      {/* 1. Unified Overlay Header */}
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
        <div className="flex flex-col gap-5">
          {/* Top 3 Prominent Diamond Crystal Category Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {top3Subcategories.map((sub) => (
              <button
                type="button"
                key={sub.id}
                onClick={() => setSubcategoryId(sub.id)}
                className="glass-strong ks-other-sub-card group relative flex items-center gap-3.5 overflow-hidden rounded-2xl p-4 text-start transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_var(--accent-glow)] active:scale-95"
                style={{
                  background: "var(--surface-strong)",
                  borderColor: "var(--accent-1)",
                  borderWidth: "1.5px",
                  boxShadow: "0 4px 16px rgba(124, 58, 237, 0.12)",
                }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-[var(--shadow-glow)] transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: "var(--chip-bg)",
                    color: "var(--accent-1)",
                  }}
                >
                  <CategoryIcon id={sub.id} size={26} />
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className="truncate text-sm font-extrabold sm:text-base"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {sub.name[lang]}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Remaining Subcategories Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
            {remainingSubcategories.map((sub) => (
              <button
                type="button"
                key={sub.id}
                onClick={() => setSubcategoryId(sub.id)}
                className="glass ks-other-sub-card group flex flex-col items-center justify-center gap-2.5 rounded-2xl p-3.5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-[0_0_14px_var(--accent-glow)] active:scale-95"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-soft)",
                  boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.08)",
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
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
