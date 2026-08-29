import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>();
  const category = categories.find((c) => c.id === categoryId);
  const list = getProductsByCategory(categoryId, subcategoryId);
  const subcategories = categoryId === "other" ? getOtherSubcategoryCounts() : [];

  useEffect(() => { setListContext({ type: "category", categoryId }); setSubcategoryId(undefined); }, [categoryId, setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between"><BackButton to="/" label={t("category.back")} /><h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}><span>{category?.icon}</span>{category ? category.name[lang] : ""}</h1><span /></div>
      {subcategories.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl p-2 sm:grid-cols-4 md:grid-cols-6">
          {[...subcategories].sort((a, b) => b.count - a.count || a.name.fa.localeCompare(b.name.fa, "fa")).map((sub) => {
            const selected = subcategoryId === sub.id;
            return (
              <button
                type="button"
                key={sub.id}
                onClick={() => setSubcategoryId(selected ? undefined : sub.id)}
                aria-pressed={selected}
                className="glass subcategory-tile inline-flex h-full flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors"
                style={{ borderColor: selected ? "var(--accent-1)" : "var(--border-soft)", color: "var(--text-primary)", ...(selected ? { boxShadow: "0 0 0 2px var(--accent-1)" } : {}) }}
              >
                <span aria-hidden="true" className="text-xl leading-none">{subcategoryIcons[sub.id] ?? "📁"}</span>
                <span className="text-center leading-5">{sub.name[lang]}</span>
                <span className="rounded-full px-1.5 text-[10px] font-medium" style={{ background: "var(--input-bg)", color: "var(--text-muted)" }}>
                  {sub.count} {t("category.productsCount")}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {subcategories.length === 0 && <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>{list.length} {t("category.productsCount")}</p>}
      {subcategories.length > 0 && !subcategoryId ? (
        <p className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("category.selectSubcategory")}</p>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("search.noResults")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">{list.map((p) => <ProductCard key={p.id} product={p} minimal />)}</div>
      )}
    </div>
  );
}
