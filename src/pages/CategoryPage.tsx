import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import CategoryIcon from "../components/CategoryIcon";
import CategoryOverlayHeader from "../components/CategoryOverlayHeader";

/** Categories spotlighted as one unified crystal group inside "سایر" (no counts). */
const SPOTLIGHT_CATEGORY_IDS = ["powder-sponge-holder", "colander-bowl", "soap-dish"];

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const [params] = useSearchParams();
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>(params.get("sub") ?? undefined);
  const category = categories.find((c) => c.id === categoryId);
  const list = useMemo(() => getProductsByCategory(categoryId, subcategoryId), [categoryId, subcategoryId]);
  const subcategories = categoryId === "other" ? getOtherSubcategoryCounts() : [];
  const spotlight = useMemo(
    () => (categoryId === "other" ? SPOTLIGHT_CATEGORY_IDS.map((id) => subcategories.find((sub) => sub.id === id)).filter((sub): sub is (typeof subcategories)[number] => !!sub) : []),
    [categoryId, subcategories]
  );
  const remainingSubcategories = useMemo(
    () => subcategories.filter((sub) => !SPOTLIGHT_CATEGORY_IDS.includes(sub.id)),
    [subcategories]
  );

  useEffect(() => {
    setListContext({ type: "category", categoryId });
    setSubcategoryId(params.get("sub") ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <CategoryOverlayHeader
        categoryId={subcategoryId ?? categoryId}
        title={subcategoryId ? subcategories.find((sub) => sub.id === subcategoryId)?.name[lang] ?? category?.name[lang] ?? "" : category?.name[lang] ?? ""}
        to="/"
        onBack={categoryId === "other" && subcategoryId ? () => setSubcategoryId(undefined) : undefined}
      />

      {!subcategoryId && spotlight.length > 0 && (
        <section className="glass mb-5 rounded-3xl p-3 sm:p-4" aria-label={t("category.spotlightAria")}>
          <div className="flex flex-col gap-2.5">
            {spotlight.map((spot) => (
              <button type="button" key={spot.id} onClick={() => setSubcategoryId(spot.id)} className="ks-spotlight-card ks-other-sub-card">
                <span className="ks-spotlight-diamond" aria-hidden="true">
                  <span><CategoryIcon id={spot.id} size={22} /></span>
                </span>
                <span className="ks-tile-name min-w-0 flex-1 text-start" style={{ color: "var(--text-primary)" }}>
                  {spot.name[lang]}
                </span>
                <span className="shrink-0 text-xs font-bold" style={{ color: "var(--accent-1)" }}>
                  {t("category.viewCategory")}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {!subcategoryId && remainingSubcategories.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl p-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {remainingSubcategories.map((sub) => (
            <button
              type="button"
              key={sub.id}
              onClick={() => setSubcategoryId(subcategoryId === sub.id ? undefined : sub.id)}
              className="glass subcategory-tile ks-other-sub-card inline-flex min-w-0 flex-col items-center gap-2 rounded-2xl px-3 py-3 transition-all hover:-translate-y-0.5"
              aria-pressed={subcategoryId === sub.id}
              style={{ borderColor: subcategoryId === sub.id ? "var(--accent-1)" : "var(--border-soft)", color: "var(--text-primary)" }}
            >
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}><CategoryIcon id={sub.id} size={22} /></span>
              <span className="ks-subtile-name line-clamp-2">{sub.name[lang]}</span>
            </button>
          ))}
        </div>
      )}

      {(categoryId !== "other" || subcategoryId) && (
        <>
          <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>{list.length} {t("category.productsCount")}</p>
          {list.length === 0 ? (
            <p className="py-16 text-center text-base" style={{ color: "var(--text-muted)" }}>{t("search.noResults")}</p>
          ) : (
            <div className="ks-product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
              {list.map((p) => <ProductCard key={p.id} product={p} minimal />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
