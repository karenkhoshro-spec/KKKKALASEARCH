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
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return undefined;
    }
    return undefined;
  }
  return trimmed;
}

function ProductCard({ product, minimal = false, hidePrice = false }: { product: Product; minimal?: boolean; hidePrice?: boolean }) {
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

  return (
    <div className={`ks-product-card group animate-fade-up relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 ${minimal ? "is-minimal" : ""}`}>
      {!minimal && (
        <div className="ks-product-image-wrapper">
          <Link
            to={`/product/${product.id}`}
            className="ks-product-image-link"
            aria-label={product.name[lang]}
          >
            {media}
          </Link>
        </div>
      )}

      <Link to={`/product/${product.id}`} className={`ks-product-content-link ${minimal ? "text-center" : "px-3 pb-3 pt-1 text-center"}`}>
        <h3 className={`line-clamp-2 ${minimal ? "text-sm font-extrabold leading-6 sm:text-base" : "text-sm font-extrabold leading-6 sm:text-base"}`} style={{ color: "var(--text-primary)" }}>
          {product.name[lang]}
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
