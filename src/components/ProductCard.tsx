import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

export default function ProductCard({ product, minimal = false }: { product: Product; minimal?: boolean }) {
  const { lang, t } = useLanguage();
  return (
    <Link to={`/product/${product.id}`} className={`group animate-fade-up glass relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] ${minimal ? "p-3" : ""}`} style={{ borderColor: "var(--border-soft)" }}>
      {!minimal && <div className="product-media aspect-square w-full p-4">{product.image ? <img src={product.image} alt={product.name[lang]} loading="lazy" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" /> : <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("product.imageUnavailable")}</span>}</div>}
      <div className={minimal ? "text-center" : "px-3.5 pb-4 pt-1 text-center"}>
        <h3 className="line-clamp-2 text-sm font-semibold leading-6" style={{ color: "var(--text-primary)" }}>{product.name[lang]}</h3>
        <div className="mt-1.5 text-sm font-bold" style={{ color: product.price !== undefined ? "var(--accent-1)" : "var(--text-muted)" }}>{product.price !== undefined ? `${product.price.toLocaleString()} ${t("product.toman")}` : t("product.priceUnknown")}</div>
        {!minimal && !product.inStock && <span className="mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: "var(--chip-bg)", color: "var(--danger)" }}>{t("product.outOfStock")}</span>}
      </div>
    </Link>
  );
}
