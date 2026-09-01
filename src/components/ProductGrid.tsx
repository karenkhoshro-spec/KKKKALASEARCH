import { memo, useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Product } from "../types";
import ProductCard from "./ProductCard";

/**
 * Product grid used by every list surface (category, search, catalog, wishlist).
 *
 * Long catalogues used to mount all cards at once (347 on /products), which is
 * what made first paint and scrolling feel slow on a phone. Cards are now
 * revealed in pages as the reader approaches the end — the list itself is still
 * filtered, sorted and counted in a single pass, so nothing about the data or
 * the search behaviour changes.
 *
 * `noImage` keeps the category/search cards free of product photos, which must
 * only appear on the product details screen.
 */
function ProductGrid({
  products,
  pageSize = 24,
  hidePrice = false,
  noImage = false,
  emptyLabel,
}: {
  products: Product[];
  pageSize?: number;
  hidePrice?: boolean;
  noImage?: boolean;
  emptyLabel?: string;
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(() => Math.max(pageSize, 1));
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // a different result set starts from the first page again
  useEffect(() => {
    setVisible(Math.max(pageSize, 1));
  }, [products, pageSize]);

  const hasMore = products.length > visible;

  useEffect(() => {
    if (!hasMore || typeof IntersectionObserver === "undefined") return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((current) => Math.min(current + pageSize, products.length));
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, pageSize, products.length]);

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
        {emptyLabel ?? t("search.noResults")}
      </p>
    );
  }

  const shown = products.slice(0, visible);
  return (
    <>
      <div ref={gridRef} className="ks-category-product-grid">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} hidePrice={hidePrice} noImage={noImage} />
        ))}
      </div>
      <div ref={sentinelRef} className="mt-4 flex items-center justify-center gap-3">
        <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
          {t("product.showingCount", { shown: String(shown.length), total: String(products.length) })}
        </span>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setVisible((current) => Math.min(current + pageSize, products.length))}
            className="glass rounded-xl px-3.5 py-2 text-[11px] font-bold transition-transform hover:scale-[1.02] active:scale-95 sm:text-xs"
            style={{ color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
          >
            {t("product.showMore", { count: String(Math.min(pageSize, products.length - visible)) })}
          </button>
        ) : null}
      </div>
    </>
  );
}

export default memo(ProductGrid);
