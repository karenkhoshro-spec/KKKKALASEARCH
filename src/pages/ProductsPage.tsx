import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Home as HomeIcon, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { products, isProductListable } from "../data/products";
import ProductCard from "../components/ProductCard";
import { goBack } from "../utils/safeBack";

type SortKey = "newest" | "cheapest" | "expensive";

export default function ProductsPage() {
  const { t, lang, dir } = useLanguage();
  const navigate = useNavigate();
  const { setListContext } = useListContext();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    setListContext({ type: "products" });
  }, [setListContext]);

  const handleBack = () => {
    goBack(navigate);
  };

  const handleHome = () => {
    navigate("/");
  };

  const list = useMemo(() => {
    let arr = (categoryId === "all" ? products : products.filter((p) => p.categoryId === categoryId)).filter(isProductListable);
    if (sort === "cheapest") arr = arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "expensive") arr = arr.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return arr;
  }, [categoryId, sort]);

  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6" dir={dir}>
      {/* All-products navigation header — Home + Back live in the same clean
          container; in RTL the controls sit on the physical LEFT side. */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-soft)" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}
          >
            <Package size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black sm:text-lg" style={{ color: "var(--text-primary)" }}>
              {t("menu.products") || "همه محصولات"}
            </h1>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
              {list.length} {t("category.productsCount") || "محصول"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHome}
            aria-label={t("menu.home") || "صفحه اصلی"}
            className="glass flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition-all duration-200 hover:scale-[1.03] active:scale-95 sm:text-[0.82rem]"
            style={{ color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
          >
            <HomeIcon size={15} />
            <span>{t("menu.home") || "صفحه اصلی"}</span>
          </button>
          <button type="button" onClick={handleBack} className="ks-back-button">
            <span>{t("category.back") || "بازگشت"}</span>
            <ArrowIcon size={16} />
          </button>
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
