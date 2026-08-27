import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

export default function ProductCard({ product }: { product: Product }) {
  const { lang, t } = useLanguage();

  return (
    <Link
      to={`/product/${product.id}`}
      className="group animate-fade-up glass relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
      style={{ borderColor: "var(--border-soft)" }}
    >
      {/* Implementation 6: Remove extra border/shadow/container around image - keep card but image area clean */}
      <div className="relative aspect-square w-full overflow-hidden bg-transparent">
        <img
          src={product.image}
          alt={product.name[lang]}
          loading="lazy"
          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          style={{ background: "transparent" }}
        />
      </div>

      <div className="px-3.5 pb-4 pt-2 text-center">
        <h3 className="line-clamp-2 text-sm font-semibold leading-6" style={{ color: "var(--text-primary)" }}>
          {product.name[lang]}
        </h3>
        <div className="mt-1.5 flex flex-col items-center gap-1">
          <span className="text-xs font-bold" style={{ color: "var(--accent-1)" }}>
            {product.price.toLocaleString()} {t("product.toman")}
          </span>
          {!product.inStock && (
            <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: "var(--chip-bg)", color: "var(--danger)" }}>
              {t("product.outOfStock")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
