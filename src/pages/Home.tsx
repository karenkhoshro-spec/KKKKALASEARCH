import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, ArrowDownWideNarrow, Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import SearchBar from "../components/SearchBar";
import CategoryNav from "../components/CategoryNav";
import ProductCard from "../components/ProductCard";
import { products, searchListableProducts, productUsableImageUrl } from "../data/products";

const INITIAL_VISIBLE = 8;

type PriceSort = "default" | "cheapest" | "expensive";

export default function Home() {
  const { t } = useLanguage();
  const { setListContext } = useListContext();
  const [sort, setSort] = useState<PriceSort>("default");
  const [expanded, setExpanded] = useState(false);
  const [quickQuery, setQuickQuery] = useState("");
  const deferredQuickQuery = useDeferredValue(quickQuery);

  useEffect(() => {
    setListContext({ type: "home" });
  }, [setListContext]);

  // Compact quick search: precisely filtered live results inside the Home
  // product area (same relevance engine as the global search — no popups,
  // no suggestions, only real matching products).
  const quickResults = useMemo(
    () => (deferredQuickQuery.trim() ? searchListableProducts(deferredQuickQuery, "fa") : []),
    [deferredQuickQuery],
  );

  // Keep every catalog product available in the Home index, but keep the
  // useful products at the front: in-stock + image-backed, then in-stock
  // without an image, then unavailable with an image, then unavailable and
  // image-less. Name-only cards make the final two groups honest without
  // rendering broken image placeholders.
  const orderedCatalog = useMemo(() => {
    const bucket = (product: (typeof products)[number]) => {
      const hasImage = productUsableImageUrl(product) !== undefined;
      if (product.inStock && hasImage) return 0;
      if (product.inStock) return 1;
      if (hasImage) return 2;
      return 3;
    };
    return [...products].sort((a, b) => {
      const bucketDifference = bucket(a) - bucket(b);
      if (bucketDifference !== 0) return bucketDifference;
      if (sort === "cheapest") return (a.price ?? Infinity) - (b.price ?? Infinity);
      if (sort === "expensive") return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      return 0;
    });
  }, [sort]);

  // Tapping the active price chip again returns to the natural catalog order —
  // every control stays live, there is no dead default option in the UI.
  const cyclePriceSort = (key: Exclude<PriceSort, "default">) => {
    setSort((current) => (current === key ? "default" : key));
  };

  const shown = (quickQuery.trim() ? quickResults : orderedCatalog).slice(
    0,
    quickQuery.trim() || expanded ? undefined : INITIAL_VISIBLE,
  );
  const quickActive = Boolean(quickQuery.trim());
  const remaining = quickActive ? 0 : orderedCatalog.length - INITIAL_VISIBLE;

  const priceChip = (key: "cheapest" | "expensive", label: string) => {
    const active = sort === key;
    return (
      <button
        type="button"
        onClick={() => cyclePriceSort(key)}
        aria-pressed={active}
        className="cursor-pointer rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition-all duration-200 active:scale-95 sm:text-xs"
        style={
          active
            ? { background: "var(--accent-1)", color: "#fff", boxShadow: "0 0 10px var(--shadow-glow)" }
            : { background: "transparent", color: "var(--text-muted)" }
        }
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-4 pb-16 pt-6 sm:px-6">
      {/* Smart search */}
      <section className="mb-8 flex flex-col items-center overflow-visible text-center">
        <div className="w-full max-w-2xl">
          <SearchBar large />
        </div>
      </section>

      {/* دسته‌بندی محصولات — full category box (the quick-access area) */}
      <section className="mb-6 mt-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}
          >
            <LayoutGrid size={18} />
          </span>
          <h2 className="text-xl font-black sm:text-2xl" style={{ color: "var(--text-primary)" }}>
            {t("home.quickAccess") || "دسته‌بندی محصولات"}
          </h2>
        </div>

        <CategoryNav />
      </section>

      {/* همه محصولات — the main product cards stay here */}
      <section className="mb-10 mt-3">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <h2 className="text-xl font-black sm:text-2xl" style={{ color: "var(--text-primary)" }}>
              {t("home.allProducts") || "همه محصولات"}
            </h2>
            <span
              className="glass rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ background: "var(--chip-bg)", color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
            >
              {quickActive ? quickResults.length : orderedCatalog.length} {t("category.productsCount") || "محصول"}
            </span>
          </div>

          {/* Compact quick search — small, centered near the section header.
              Filters the product list below in place (no popups/alerts). */}
          <div className="glass flex items-center gap-2 rounded-2xl px-3 py-1.5" style={{ border: "1px solid var(--border-soft)" }}>
            <Search size={14} className="shrink-0" style={{ color: "var(--accent-1)" }} aria-hidden="true" />
            <input
              type="search"
              value={quickQuery}
              onChange={(event) => setQuickQuery(event.target.value)}
              placeholder={t("home.quickSearch") || "جستجوی سریع"}
              aria-label={t("home.quickSearch") || "جستجوی سریع"}
              className="w-36 bg-transparent text-xs font-bold outline-none placeholder:font-semibold placeholder:text-[var(--text-muted)] sm:w-48 sm:text-sm"
              style={{ color: "var(--text-primary)" }}
            />
            {quickActive && (
              <button
                type="button"
                onClick={() => setQuickQuery("")}
                aria-label={t("home.seeLess") || "پاک کردن"}
                className="cursor-pointer text-xs font-black"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Price sorting control — compact; hidden while quick search filters */}
        {!quickActive && (
          <div
            className="glass mb-4 flex w-fit items-center gap-1 rounded-2xl p-1"
            style={{ border: "1px solid var(--border-soft)" }}
            role="group"
            aria-label={t("filters.sortBy") || "مرتب‌سازی"}
          >
            <ArrowDownWideNarrow size={14} className="ms-1.5 me-0.5 shrink-0" style={{ color: "var(--accent-1)" }} />
            {priceChip("cheapest", t("filters.cheapest") || "ارزان‌ترین")}
            {priceChip("expensive", t("filters.expensive") || "گران‌ترین")}
          </div>
        )}

        {quickActive ? (
          <>
            <div className="ks-category-product-grid">
              {shown.map((product) => (
                <ProductCard key={product.id} product={product} nameOnly />
              ))}
            </div>
            {shown.length === 0 && (
              <p className="py-10 text-center text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                {t("search.noResults") || "نتیجه‌ای یافت نشد"}
              </p>
            )}
          </>
        ) : (
          <div className="ks-category-product-grid">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} nameOnly />
            ))}
          </div>
        )}

        {/* Expandable slide panel for the rest of the catalog */}
        {remaining > 0 && (
          <div className="mt-4">
            {!expanded ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="ks-home-expand-btn flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <ChevronDown size={17} />
                  {t("home.seeMore") || "مشاهده بیشتر"}
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold">{remaining}</span>
                </button>
              </div>
            ) : (
              <div className="ks-more-panel">
                <div className="ks-more-panel-inner">
                  <div className="ks-category-product-grid">
                    {orderedCatalog.slice(INITIAL_VISIBLE).map((product) => (
                      <ProductCard key={product.id} product={product} nameOnly />
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="glass flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold transition-transform hover:scale-[1.02] active:scale-95"
                    style={{ color: "var(--accent-1)", border: "1.5px solid rgba(168, 85, 247, 0.35)" }}
                  >
                    <ChevronUp size={17} />
                    {t("home.seeLess") || "بستن"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
