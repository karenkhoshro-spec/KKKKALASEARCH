import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { isValidImageUrl, fullImageChain } from "../data/productImageResolver";
import "./ProductCard.css";

function getProductImageUrl(product: Product): string | undefined {
  const raw = (product as any).productImageUrl || product.image;
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  if (!isValidImageUrl(trimmed)) {
    return undefined;
  }
  return trimmed;
}

/**
 * NOTE: the old CardSideRail (کد محصول / شناسه کالا pinned to the card edges)
 * and the compact corner chips were removed — identifiers live only on the
 * Product Details page now.
 */

/**
 * NOTE: product code (کد محصول) and item id (شناسه کالا) no longer render on
 * ANY product listing card — they are only shown on the full Product Details
 * page (مشخصات کامل کالا section). The compact-corner-chip helpers were
 * removed; the underlying catalog data is untouched.
 */

function ProductCard({
  product,
  minimal = false,
  compact = false,
  nameOnly = false,
  hidePrice = false,
}: {
  product: Product;
  minimal?: boolean;
  compact?: boolean;
  nameOnly?: boolean;
  hidePrice?: boolean;
}) {
  const { lang, t } = useLanguage();
  const initialImageUrl = getProductImageUrl(product);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imageChain = initialImageUrl ? fullImageChain(initialImageUrl, 640) : [];
  const [imgAttempt, setImgAttempt] = useState(0);
  const imgSrc = imageChain[imgAttempt];
  const showImage = !!imgSrc;
  const advanceImgAttempt = () => { setImgLoaded(false); setImgAttempt((a) => a + 1); };
  const handleImgError = advanceImgAttempt;
  useEffect(() => {
    if (!initialImageUrl || imgLoaded || imgAttempt >= imageChain.length) return;
    const timer = setTimeout(advanceImgAttempt, 6000);
    return () => clearTimeout(timer);
  }, [initialImageUrl, imgSrc, imgLoaded]);
  const markImgLoaded = (el: HTMLImageElement | null) => { if (el?.complete && el.naturalWidth > 0) setImgLoaded(true); };

  // Product code (کد محصول) and item id (شناسه کالا) are NOT shown on cards —
  // they only appear on the full Product Details page. Catalog data untouched.

  const media = (
    <div className="product-media ks-product-media w-full">
      {showImage ? (
        <img
          key={imgSrc}
          ref={markImgLoaded}
          src={imgSrc}
          alt={product.name[lang]}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          onLoad={() => setImgLoaded(true)}
          onError={handleImgError}
        />
      ) : (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {t("product.imageUnavailable")}
        </span>
      )}
    </div>
  );

  if (minimal || nameOnly) {
    return (
      <div className={`ks-product-card group animate-fade-up relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 is-minimal`}>
        <Link to={`/product/${product.id}`} className="ks-product-content-link flex h-full w-full flex-col items-center justify-center px-2 py-2 text-center">
          <h3 className="line-clamp-2 text-sm font-extrabold leading-6 sm:text-base" style={{ color: "var(--text-primary)" }}>
            {product.name[lang]}
          </h3>
          {minimal && !nameOnly && !product.inStock && (
            <span className="ks-out-of-stock-badge">
              {t("product.outOfStock")}
            </span>
          )}
        </Link>
      </div>
    );
  }

  // The Home "همه محصولات" cards use the nameOnly branch above. This richer
  // compact variant remains available to other callers without changing their
  // image and identifier behavior.
  if (compact) {
    return (
      <div className={`ks-product-card ks-product-card--compact group animate-fade-up relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="ks-product-image-wrapper ks-product-image-wrapper--compact">
        <Link
          to={`/product/${product.id}`}
          className="ks-product-image-link"
          aria-label={product.name[lang]}
        >
          {media}
        </Link>
      </div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-between gap-1 px-2 pb-2.5 pt-2 text-center">
          <Link to={`/product/${product.id}`} className="block min-w-0" aria-label={product.name[lang]}>
            <h3 className="line-clamp-2 text-[0.84rem] font-extrabold leading-5 sm:text-[0.95rem] sm:leading-6" style={{ color: "var(--text-primary)" }}>
              {product.name[lang]}
            </h3>
          </Link>
          {!product.inStock && (
            <span className="ks-out-of-stock-badge">
              {t("product.outOfStock")}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`ks-product-card group animate-fade-up relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="ks-product-image-wrapper">
        <Link
          to={`/product/${product.id}`}
          className="ks-product-image-link"
          aria-label={product.name[lang]}
        >
          {media}
        </Link>
      </div>

      <div className="ks-product-card-main min-w-0 px-2 text-center">
        <Link to={`/product/${product.id}`} className="block" aria-label={product.name[lang]}>
          <h3 className="line-clamp-2 text-sm font-extrabold leading-6 sm:text-base" style={{ color: "var(--text-primary)" }}>
            {product.name[lang]}
          </h3>
        </Link>
        {!hidePrice && (
          <div className="mt-1 text-xs font-bold sm:text-sm" style={{ color: product.price !== undefined ? "var(--accent-1)" : "var(--text-muted)" }}>
            {product.price !== undefined ? `${product.price.toLocaleString()} ${t("product.toman")}` : t("product.priceUnknown")}
          </div>
        )}
        {!product.inStock && (
          <span className="ks-out-of-stock-badge">
            {t("product.outOfStock")}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(ProductCard);
