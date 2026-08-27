import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, Minus, Plus, ShoppingCart, CheckCircle2, XCircle, Heart } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { useListContext, listContextToPath } from "../context/ListContext";
import { getProductById, getProductsByCategory } from "../data/products";
import ProductCard from "../components/ProductCard";
import BackButton from "../components/BackButton";

export default function ProductDetails() {
  const { id = "" } = useParams();
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { isSaved, toggle } = useWishlist();
  const { listContext } = useListContext();

  const product = getProductById(id);
  const [quantity, setQuantity] = useState(1);
  const [variationId, setVariationId] = useState(product?.variations?.[0]?.id);

  const related = useMemo(
    () => (product ? getProductsByCategory(product.categoryId).filter((p) => p.id !== product.id).slice(0, 4) : []),
    [product]
  );

  if (!product) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
        <XCircle size={40} style={{ color: "var(--danger)" }} />
        <p style={{ color: "var(--text-primary)" }}>{t("errors.notFound")}</p>
        <Link to="/" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--accent-1)" }}>
          {t("errors.goHome")}
        </Link>
      </div>
    );
  }

  const selectedVariation = product.variations?.find((v) => v.id === variationId);

  const handleAddToCart = () => {
    // Implementation 16: Prevent out-of-stock products from entering cart
    if (!product || !product.inStock) {
      showToast(t("product.requestProductionToast") || "درخواست تولید ثبت شد", "info");
      return;
    }
    addItem(
      product,
      product.name[lang],
      quantity,
      selectedVariation ? { id: selectedVariation.id, name: selectedVariation.name[lang] } : undefined
    );
    showToast(t("notifications.addedToCart"), "success");
  };

  const handleRequestProduction = () => {
    // Implementation 8: Request production handler - does NOT add to cart, shows toast
    // This is an internal extensible handler for future integration
    showToast(t("product.requestProductionToast"), "info");
    // Future: could integrate with sellerDelivery or API
  };

  const backPath = listContext.type === "home" ? "/" : listContextToPath(listContext);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <BackButton to={backPath} label={t("product.back")} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Implementation 7: Smaller, more compact image container */}
        <div className="glass mx-auto flex aspect-square max-h-[340px] w-full max-w-[420px] items-center justify-center rounded-2xl p-4 sm:max-h-[380px] md:max-h-[420px] md:p-6">
          <img src={product.image} alt={product.name[lang]} className="h-full w-full object-contain" />
        </div>

        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold leading-8 sm:text-2xl" style={{ color: "var(--text-primary)" }}>
            {product.name[lang]}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            {product.inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--chip-bg)", color: "var(--success)" }}>
                <CheckCircle2 size={13} />
                {product.stockCount && product.stockCount <= 8 ? t("product.lowStock") : t("product.inStock")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--chip-bg)", color: "var(--danger)" }}>
                <XCircle size={13} />
                {t("product.outOfStock")}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold" style={{ color: "var(--accent-1)" }}>
              {product.price.toLocaleString()} {t("product.toman")}
            </span>
            {product.oldPrice && (
              <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>
                {product.oldPrice.toLocaleString()}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            {product.description[lang]}
          </p>

          {product.features.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {t("product.features")}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-1)" }} />
                    {f[lang]}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.variations && product.variations.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {t("product.variation")}
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variations.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVariationId(v.id)}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all"
                    style={{
                      borderColor: variationId === v.id ? "var(--accent-1)" : "var(--border-soft)",
                      background: variationId === v.id ? "var(--chip-bg)" : "transparent",
                      color: "var(--text-primary)",
                    }}
                  >
                    {v.color && <span className="h-3 w-3 rounded-full" style={{ background: v.color }} />}
                    {v.name[lang]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("product.quantity")}
            </span>
            <div className="glass flex items-center gap-3 rounded-xl px-2 py-1.5">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10">
                <Minus size={14} style={{ color: "var(--text-primary)" }} />
              </button>
              <span className="w-6 text-center text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {quantity}
              </span>
              <button onClick={() => setQuantity((q) => q + 1)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10">
                <Plus size={14} style={{ color: "var(--text-primary)" }} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {product.inStock ? (
              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-300 hover:scale-[1.01] active:scale-95"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                <ShoppingCart size={17} />
                {t("product.addToCart")}
              </button>
            ) : (
              <button
                onClick={handleRequestProduction}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3.5 text-sm font-bold transition-transform duration-300 hover:scale-[1.01] active:scale-95"
                style={{ borderColor: "var(--accent-1)", color: "var(--accent-1)", background: "var(--chip-bg)" }}
              >
                {t("product.requestProduction")}
              </button>
            )}
            <button
              onClick={() => {
                const added = toggle(product.id);
                showToast(added ? t("notifications.addedToWishlist") : t("notifications.removedFromWishlist"), "info");
              }}
              aria-label="wishlist"
              className="glass flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl transition-transform hover:scale-105 active:scale-95"
            >
              <Heart size={19} fill={isSaved(product.id) ? "var(--accent-3)" : "none"} style={{ color: isSaved(product.id) ? "var(--accent-3)" : "var(--text-secondary)" }} />
            </button>
          </div>

          {/* 5. Ashkan Plastic connection — dynamic per-product URL, no fake links */}
          <div className="mt-4">
            {product.ashkanProductUrl ? (
              <a
                href={product.ashkanProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ color: "var(--accent-1)" }}
              >
                <ExternalLink size={15} />
                {t("product.viewOnAshkan")}
              </a>
            ) : (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("product.linkNotSet")}
              </p>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {t("product.relatedTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
