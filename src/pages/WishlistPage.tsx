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

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      {/* Unified overlay header with back button on the left */}
      <div
        className="mb-5 flex w-full items-center justify-between border-b pb-3.5"
        style={{ borderColor: "var(--border-soft)", direction: "ltr" }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label={t("category.back") || "بازگشت"}
          className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--border-strong)",
            background: "var(--surface-strong)",
          }}
        >
          <ArrowIcon size={16} style={{ color: "var(--accent-1)" }} />
          <span dir={dir}>{t("category.back") || "بازگشت"}</span>
        </button>

        <div className="flex items-center gap-2" dir={dir}>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-3)" }}>
            <Heart size={18} />
          </div>
          <h1 className="text-base font-extrabold sm:text-lg" style={{ color: "var(--text-primary)" }}>
            {t("wishlist.title")}
          </h1>
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
