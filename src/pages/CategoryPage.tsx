import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { getImportedOtherSubcategoryCounts, getImportedProductsByCategory } from "../data/csvSource";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

export default function CategoryPage() {
  const { categoryId = "" } = useParams();
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const [subcategoryId, setSubcategoryId] = useState<string | undefined>();
  const category = categories.find((c) => c.id === categoryId);
  const list = getImportedProductsByCategory(categoryId, subcategoryId);
  const subcategories = categoryId === "other" ? getImportedOtherSubcategoryCounts() : [];

  useEffect(() => { setListContext({ type: "category", categoryId }); setSubcategoryId(undefined); }, [categoryId, setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between"><BackButton to="/" label={t("category.back")} /><h1 className="flex items-center gap-2 text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}><span>{category?.icon}</span>{category ? category.name[lang] : ""}</h1><span /></div>
      {subcategories.length > 0 && <div className="mb-5 flex flex-wrap gap-2 rounded-2xl p-2">{subcategories.map((sub) => <button type="button" key={sub.id} onClick={() => setSubcategoryId(subcategoryId === sub.id ? undefined : sub.id)} className="glass rounded-xl px-3 py-2 text-xs font-semibold transition-colors" style={{ borderColor: subcategoryId === sub.id ? "var(--accent-1)" : "var(--border-soft)", color: "var(--text-primary)" }}>{sub.name[lang]} ({sub.count})</button>)}</div>}
      <p className="mb-5 text-sm" style={{ color: "var(--text-muted)" }}>{list.length} {t("category.productsCount")}</p>
      {list.length === 0 ? <p className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("search.noResults")}</p> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">{list.map((p) => <ProductCard key={p.id} product={p} minimal />)}</div>}
    </div>
  );
}
