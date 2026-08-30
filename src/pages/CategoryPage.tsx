import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import CategoryOverlayHeader from "../components/CategoryOverlayHeader";
import CategoryIcon from "../components/CategoryIcon";

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
        <div className="flex flex-col gap-6">
          {/* Vertical Container for the 3 Prominent Diamond Crystal Category Cards */}
          <div
            className="glass-strong flex flex-col gap-2.5 rounded-3xl p-3 sm:p-4"
            style={{
              background: "var(--surface-strong)",
              border: "1.5px solid var(--accent-1)",
              boxShadow: "0 6px 24px var(--accent-glow)",
            }}
          >
            {top3Subcategories.map((sub) => (
              <button
                type="button"
                key={sub.id}
                onClick={() => setSubcategoryId(sub.id)}
                className="glass ks-other-sub-card group flex items-center justify-between rounded-2xl p-3.5 transition-all duration-300 hover:scale-[1.01] hover:border-violet-500/50 active:scale-95"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-soft)",
                  boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.1)",
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-[var(--shadow-glow)] transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: "var(--chip-bg)",
                      color: "var(--accent-1)",
                    }}
                  >
                    <CategoryIcon id={sub.id} size={24} />
                  </div>
                  <span
                    className="text-sm font-extrabold sm:text-base"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {sub.name[lang]}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: "var(--accent-1)" }}>
                  مشاهده ↗
                </span>
              </button>
            ))}
          </div>

          {/* Remaining Subcategories Grid */}
          <div className="flex flex-col gap-2.5">
            <h3 className="px-1 text-xs font-bold sm:text-sm" style={{ color: "var(--text-muted)" }}>
              سایر زیردسته‌ها
            </h3>
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
