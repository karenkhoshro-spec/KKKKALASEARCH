import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";

type SortKey = "newest" | "cheapest" | "expensive";

export default function ProductsPage() {
  const { t, lang, dir } = useLanguage();
  const navigate = useNavigate();
  const { setListContext } = useListContext();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    setListContext({ type: "products" });
  }, [setListContext]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const list = useMemo(() => {
    let arr = categoryId === "all" ? [...products] : products.filter((p) => p.categoryId === categoryId);
    if (sort === "cheapest") arr = arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "expensive") arr = arr.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return arr;
  }, [categoryId, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6" dir={dir}>
      {/* Unified overlay header with Back button on right in RTL */}
      <div
        className="mb-5 grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 border-b pb-3.5 pt-1 sm:gap-4"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("category.back") || "بازگشت"}
            className="ks-back-button"
          >
            <ArrowIcon size={16} />
            <span>{t("category.back") || "بازگشت"}</span>
          </button>
        </div>

        <div className="flex items-center justify-center">
          <div
            className="glass-strong flex items-center gap-2 rounded-2xl px-3.5 py-1.5 sm:px-4 sm:py-2"
            style={{
              border: "1.2px solid var(--border-strong)",
              background: "var(--surface-strong)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
              <Package size={16} />
            </div>
            <h1 className="truncate text-xs font-black sm:text-sm md:text-base" style={{ color: "var(--text-primary)" }}>
              {t("menu.products") || "همه محصولات"}
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <span
            className="glass rounded-full px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:text-xs"
            style={{
              background: "var(--chip-bg)",
              color: "var(--accent-1)",
              border: "1px solid var(--border-soft)",
            }}
          >
            {list.length} {t("category.productsCount") || "محصول"}
          </span>
        </div>
      </div>

      <div className="glass mb-6 flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {t("filters.category")}:
        </span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl px-3 py-1.5 text-sm outline-none cursor-pointer"
          style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
        >
          <option value="all">{t("filters.all")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[lang]}
            </option>
          ))}
        </select>

        <span className="ms-auto text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {t("filters.sortBy")}:
        </span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl px-3 py-1.5 text-sm outline-none cursor-pointer"
          style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
        >
          <option value="newest">{t("filters.newest")}</option>
          <option value="cheapest">{t("filters.cheapest")}</option>
          <option value="expensive">{t("filters.expensive")}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
