import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * Crystal product card — image + name in its own glass box.
 * NO price here (price belongs to Product Details / Cart only).
 * Compact image area so cards never overflow on small screens.
 */
export default function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useLanguage();

  return (
    <Link
      to={`/product/${product.id}`}
      className="group ks-ring animate-fade-up glass relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
      style={{ borderColor: "var(--border-soft)" }}
    >
      <div className="product-media h-32 w-full p-3 sm:h-36 sm:p-3.5">
        <img
          src={product.image}
          alt={product.name[lang]}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="px-3 pb-3.5 pt-1 text-center">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-5 sm:text-sm sm:leading-6" style={{ color: "var(--text-primary)" }}>
          {product.name[lang]}
        </h3>
        <p className="mt-1 text-[10px] font-medium tracking-wide sm:text-[11px]" style={{ color: "var(--text-muted)" }} dir="ltr">
          {product.productCode}
        </p>
        {!product.inStock && (
          <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: "var(--chip-bg)", color: "var(--danger)" }}>
            {t("product.outOfStock")}
          </span>
        )}
      </div>
    </Link>
  );
}
