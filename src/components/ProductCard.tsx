import { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { imageCandidatesToTry, markImageFailed, markImageLoaded } from "../data/productImageResolver";
import CategoryIcon from "./CategoryIcon";
import "./ProductCard.css";

/**
 * Catalog card.
 *
 * Two presentations, deliberately:
 *  - `noImage` (category + search screens): the product photo must NOT appear
 *    there — the real mapped image belongs to Product Details (and to the cart /
 *    order lines). The card keeps what identifies the product: name, code,
 *    availability, price when allowed, and the category icon.
 *  - default (all-products / wishlist): the real mapped image, requested
 *    through the shared fallback memory so the same asset is never downloaded
 *    three times across surfaces.
 *
 * Nothing is ever faked: when the product has no real mapping the card shows
 * the honest "no image" label and no request is made.
 */
function ProductCard({
  product,
  minimal = false,
  hidePrice = false,
  noImage = false,
}: {
  product: Product;
  minimal?: boolean;
  hidePrice?: boolean;
  noImage?: boolean;
}) {
  const { lang, t } = useLanguage();
  const name = product.name[lang];
  const initialImageUrl = noImage ? "" : String((product as { productImageUrl?: string }).productImageUrl || product.image || "").trim();
  const [candidates] = useState(() => imageCandidatesToTry(initialImageUrl || undefined, 640).candidates);
  const [attempt, setAttempt] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const imgSrc = candidates[attempt]?.src;
  const showImage = !noImage && !!imgSrc;

  const advance = () => {
    setImgLoaded(false);
    const entry = candidates[attempt];
    if (initialImageUrl && entry && attempt < candidates.length - 1) markImageFailed(initialImageUrl, 640, entry.index);
    setAttempt((a) => Math.min(a + 1, candidates.length - 1));
  };

  // A hung request must not leave an empty box; after the last candidate the
  // card falls back to the label.
  useEffect(() => {
    if (!imgSrc || imgLoaded || attempt >= candidates.length - 1) return;
    timerRef.current = setTimeout(advance, 6000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgSrc, imgLoaded, attempt, candidates.length]);

  const media = (
    <div className="product-media ks-product-media w-full">
      {showImage ? (
        <img
          key={imgSrc}
          src={imgSrc}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          onLoad={(event) => {
            const el = event.currentTarget;
            if (el.naturalWidth > 0) {
              setImgLoaded(true);
              const entry = candidates[attempt];
              if (initialImageUrl && entry) markImageLoaded(initialImageUrl, 640, entry.index);
            } else {
              advance();
            }
          }}
          onError={advance}
        />
      ) : (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t("product.imageUnavailable")}
        </span>
      )}
    </div>
  );

  const code = product.productCode ?? product.sku ?? product.id;
  // only reserve a second row when there is something to say there
  const showInfoRow = (!hidePrice && product.price !== undefined) || !product.inStock;

  if (noImage) {
    return (
      <Link
        to={`/product/${product.id}`}
        className="ks-product-card ks-product-card--no-image group flex items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-start transition-all duration-300 sm:gap-3 sm:px-3"
        aria-label={name}
      >
        <span
          className="ks-product-card-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
          style={{ background: "var(--chip-bg)", color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
          aria-hidden="true"
        >
          <CategoryIcon id={product.categoryId} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[13px] font-extrabold leading-5 sm:text-sm" style={{ color: "var(--text-primary)" }}>
            {name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("product.productCode")}: <span dir="ltr">{code}</span>
          </span>
          {showInfoRow ? (
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              {!hidePrice && product.price !== undefined ? (
                <span className="text-[11px] font-bold sm:text-xs" style={{ color: "var(--accent-1)" }}>
                  {product.price.toLocaleString("fa-IR")} {t("product.toman")}
                </span>
              ) : null}
              {!product.inStock ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-black"
                  style={{ background: "rgba(239,68,68,0.14)", color: "#b91c1c", border: "1px solid rgba(239,68,68,0.4)" }}
                >
                  {t("product.outOfStock")}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      </Link>
    );
  }

  return (
    <div className={`ks-product-card group animate-fade-up relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 ${minimal ? "is-minimal" : ""}`}>
      {!minimal && (
        <div className="ks-product-image-wrapper">
          <Link to={`/product/${product.id}`} className="ks-product-image-link" aria-label={name}>
            {media}
          </Link>
        </div>
      )}

      <Link to={`/product/${product.id}`} className={`ks-product-content-link ${minimal ? "text-center" : "px-3 pb-3 pt-1 text-center"}`}>
        <h3 className="line-clamp-2 text-sm font-extrabold leading-6 sm:text-base" style={{ color: "var(--text-primary)" }}>
          {name}
        </h3>
        {!minimal && !hidePrice && (
          <div className="mt-1 text-xs font-bold sm:text-sm" style={{ color: product.price !== undefined ? "var(--accent-1)" : "var(--text-muted)" }}>
            {product.price !== undefined ? `${product.price.toLocaleString()} ${t("product.toman")}` : t("product.priceUnknown")}
          </div>
        )}
        {!minimal && !product.inStock && (
          <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "var(--chip-bg)", color: "var(--danger)" }}>
            {t("product.outOfStock")}
          </span>
        )}
      </Link>
    </div>
  );
}

export default memo(ProductCard);
