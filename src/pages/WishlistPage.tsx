import { useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { useWishlist } from "../context/WishlistContext";
import { products } from "../data/products";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { t } = useLanguage();
  const { setListContext } = useListContext();
  const { ids } = useWishlist();
  const list = products.filter((p) => ids.includes(p.id));

  useEffect(() => {
    setListContext({ type: "wishlist" });
  }, [setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/" />
        <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--text-primary)" }}>
          {t("wishlist.title")}
        </h1>
        <span />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Heart size={40} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("wishlist.empty")}
          </p>
        </div>
      ) : (
        <div className="ks-product-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
