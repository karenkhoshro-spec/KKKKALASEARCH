import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import type { Product } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { isValidProductUrl } from "../data/csvSource";
import { isValidImageUrl } from "../data/productImageResolver";
import "./ProductCard.css";

function getProductUrl(product: Product): string | undefined {
  const raw = product.productUrl || product.ashkanProductUrl;
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!isValidProductUrl(trimmed)) return undefined;
  return trimmed;
}

function getProductImageUrl(product: Product): string | undefined {
  const raw = (product as any).productImageUrl || product.image;
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  if (!isValidImageUrl(trimmed)) {
    // Fallback to check if it's at least http/https (for legacy image field which may be empty)
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      // still allow if it looks like image URL, even if isValidImageUrl filtered logo etc.
      // For product.image field which is currently empty in CSV, we keep strict check
      return undefined;
    }
    return undefined;
  }
  return trimmed;
}

export default function ProductCard({ product, minimal = false }: { product: Product; minimal?: boolean }) {
  const { lang, t } = useLanguage();
  const productUrl = getProductUrl(product);
  const hasValidUrl = !!productUrl;
  const initialImageUrl = getProductImageUrl(product);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const showImage = !!initialImageUrl && !imgError;

  return (
    <div className={`ks-product-card group animate-fade-up relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 ${minimal ? "p-3" : ""}`}>
      {!minimal && (
        <div className="ks-product-image-wrapper">
          {hasValidUrl ? (
            <a
              href={productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ks-product-image-link"
              aria-label={`مشاهده کامل محصول ${product.name[lang]}`}
            >
              <div className="product-media aspect-square w-full p-4">
                {showImage ? (
                  <img
                    src={initialImageUrl}
                    alt={product.name[lang]}
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("product.imageUnavailable")}
                  </span>
                )}
              </div>
              <div className="ks-product-image-overlay" aria-hidden="true">
                <span className="ks-product-image-cta">
                  جهت مشاهده کامل محصول کلیک کنید
                  <span className="ks-product-image-arrow">
                    <ExternalLink size={10} />
                  </span>
                </span>
              </div>
            </a>
          ) : (
            <Link
              to={`/product/${product.id}`}
              className="ks-product-image-link"
              aria-label={product.name[lang]}
            >
              <div className="product-media aspect-square w-full p-4">
                {showImage ? (
                  <img
                    src={initialImageUrl}
                    alt={product.name[lang]}
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("product.imageUnavailable")}
                  </span>
                )}
              </div>
            </Link>
          )}
        </div>
      )}

      <Link to={`/product/${product.id}`} className={`ks-product-content-link ${minimal ? "text-center" : "px-3.5 pb-4 pt-1 text-center"}`}>
        <h3 className="line-clamp-2 text-base font-bold leading-7" style={{ color: "var(--text-primary)" }}>
          {product.name[lang]}
        </h3>
        {!minimal && (
          <div className="mt-1.5 text-sm font-bold" style={{ color: product.price !== undefined ? "var(--accent-1)" : "var(--text-muted)" }}>
            {product.price !== undefined ? `${product.price.toLocaleString()} ${t("product.toman")}` : t("product.priceUnknown")}
          </div>
        )}
        {!minimal && !product.inStock && (
          <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: "var(--chip-bg)", color: "var(--danger)" }}>
            {t("product.outOfStock")}
          </span>
        )}
      </Link>
    </div>
  );
}
