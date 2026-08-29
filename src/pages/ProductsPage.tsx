import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

type SortKey = "newest" | "cheapest" | "expensive";

export default function ProductsPage() {
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    setListContext({ type: "products" });
  }, [setListContext]);

  const list = useMemo(() => {
    let arr = categoryId === "all" ? [...products] : products.filter((p) => p.categoryId === categoryId);
    if (sort === "cheapest") arr = arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "expensive") arr = arr.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return arr;
  }, [categoryId, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/" />
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
          {t("menu.products")}
        </h1>
        <span />
      </div>

      <div className="glass mb-6 flex flex-wrap items-center gap-3 rounded-2xl p-3">
        <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          {t("filters.category")}:
        </span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl px-3 py-1.5 text-sm outline-none"
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
          className="rounded-xl px-3 py-1.5 text-sm outline-none"
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
