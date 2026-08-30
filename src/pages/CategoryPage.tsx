import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

const subcategoryIcons: Record<string, string> = {
  spice: "🧂", "pitcher-glass": "🥤", juicer: "🍹", "ice-holder": "🧊", "butter-holder": "🧈", "spoon-holder": "🥄",
  bucket: "🪣", "basin-bathtub": "🛁", "plant-saucer": "🪴", "flower-pot": "🌷", "shopping-basket-other": "🧺", "oval-basket": "🧺",
  janani: "🗃️", organizer: "📦", "laundry-basket": "👕", "kitchen-tools": "🍴", "cleaning-tools": "🧹", storage: "🫙",
  tray: "🍽️", chair: "🪑", hanger: "🧷", "paper-holder": "🧻", toolbox: "🧰", "straw-basket": "🥖",
};

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
    () => (categoryId === "other" ? SPOTLIGHT_CATEGORY_IDS.map((id) => categories.find((c) => c.id === id)).filter((c): c is (typeof categories)[number] => !!c) : []),
    [categoryId]
  );

  useEffect(() => {
    setListContext({ type: "category", categoryId });
    setSubcategoryId(params.get("sub") ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <BackButton to="/" label={t("category.back")} />
        <h1 className="ks-page-title flex min-w-0 items-center gap-2 text-center" style={{ color: "var(--text-primary)" }}>
          <span aria-hidden="true">{category?.icon}</span>
          <span className="truncate">{category ? category.name[lang] : ""}</span>
        </h1>
        <span />
      </div>

      {spotlight.length > 0 && (
        <section className="glass mb-5 rounded-3xl p-3 sm:p-4" aria-label={t("category.spotlightAria")}>
          <div className="flex flex-col gap-2.5">
            {spotlight.map((spot) => (
              <Link key={spot.id} to={`/category/${spot.id}`} className="ks-spotlight-card">
                <span className="ks-spotlight-diamond" aria-hidden="true">
                  <span>{spot.icon}</span>
                </span>
                <span className="ks-tile-name min-w-0 flex-1 text-start" style={{ color: "var(--text-primary)" }}>
                  {spot.name[lang]}
                </span>
                <span className="shrink-0 text-xs font-bold" style={{ color: "var(--accent-1)" }}>
                  {t("category.viewCategory")}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {subcategories.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2 rounded-2xl p-2">
          {subcategories.map((sub) => (
            <button
              type="button"
              key={sub.id}
              onClick={() => setSubcategoryId(subcategoryId === sub.id ? undefined : sub.id)}
              className="glass subcategory-tile inline-flex min-w-[92px] flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 transition-colors"
              style={{ borderColor: subcategoryId === sub.id ? "var(--accent-1)" : "var(--border-soft)", color: "var(--text-primary)" }}
            >
              <span aria-hidden="true" className="text-xl leading-none">{subcategoryIcons[sub.id] ?? "📁"}</span>
              <span className="ks-subtile-name">{sub.name[lang]}</span>
            </button>
          ))}
        </div>
      )}

      <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>{list.length} {t("category.productsCount")}</p>
      {list.length === 0 ? (
        <p className="py-16 text-center text-base" style={{ color: "var(--text-muted)" }}>{t("search.noResults")}</p>
      ) : (
        <div className="ks-product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {list.map((p) => <ProductCard key={p.id} product={p} minimal />)}
        </div>
      )}
    </div>
  );
}
