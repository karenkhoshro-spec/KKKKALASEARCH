import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { useWishlist } from "../context/WishlistContext";
import { products } from "../data/products";
import ProductGrid from "../components/ProductGrid";
import { goBack } from "../utils/safeBack";
import { Heart } from "lucide-react";
import OverlayHeader from "../components/OverlayHeader";

export default function WishlistPage() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const { setListContext } = useListContext();
  const { ids } = useWishlist();
  const list = products.filter((p) => ids.includes(p.id));

  useEffect(() => {
    setListContext({ type: "wishlist" });
  }, [setListContext]);

  const handleBack = () => {
    goBack(navigate);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6" dir={dir}>
      <OverlayHeader
        onBack={handleBack}
        leading={
          list.length > 0 ? (
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
          )
        }
        title={
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
            <h1 className="truncate text-xs font-black sm:text-sm" style={{ color: "var(--text-primary)" }}>
              {t("wishlist.title")}
            </h1>
          </div>
        }
      />

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
        <ProductGrid products={list} />
      )}
    </div>
  );
}
