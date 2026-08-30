import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { useWishlist } from "../context/WishlistContext";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import { Heart, ArrowRight, ArrowLeft } from "lucide-react";

export default function WishlistPage() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const { setListContext } = useListContext();
  const { ids } = useWishlist();
  const list = products.filter((p) => ids.includes(p.id));
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    setListContext({ type: "wishlist" });
  }, [setListContext]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6" dir={dir}>
      {/* Unified overlay header with Back button on right in RTL */}
      <div
        className="mb-5 grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 border-b pb-3.5 pt-1 sm:gap-4"
        style={{ borderColor: "var(--border-soft)" }}
      >
        <div className="flex items-center justify-start">
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("category.back") || "بازگشت"}
            className="ks-back-button"
          >
            <ArrowIcon size={16} />
            <span>{t("category.back") || "بازگشت"}</span>
          </button>
        </div>

        <div className="flex items-center justify-center">
          <div
            className="glass-strong flex items-center gap-2 rounded-2xl px-3.5 py-1.5 sm:px-4 sm:py-2"
            style={{
              border: "1.2px solid var(--border-strong)",
              background: "var(--surface-strong)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--chip-bg)", color: "var(--accent-3)" }}>
              <Heart size={16} />
            </div>
            <h1 className="truncate text-xs font-black sm:text-sm md:text-base" style={{ color: "var(--text-primary)" }}>
              {t("wishlist.title")}
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-end">
          {list.length > 0 ? (
            <span
              className="glass rounded-full px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:text-xs"
              style={{
                background: "var(--chip-bg)",
                color: "var(--accent-3)",
                border: "1px solid var(--border-soft)",
              }}
            >
              {list.length} {t("category.productsCount") || "محصول"}
            </span>
          ) : (
            <div className="w-4" />
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "var(--chip-bg)", color: "var(--text-muted)" }}>
            <Heart size={36} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("wishlist.empty")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
