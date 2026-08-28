import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, Minus, Plus, ShoppingCart, CheckCircle2, XCircle, Heart } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { useListContext, listContextToPath } from "../context/ListContext";
import { getProductById } from "../data/products";
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
  const [showSpecs, setShowSpecs] = useState(false);

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
  const available = selectedVariation?.inStock ?? product.inStock;
  const activePrice = selectedVariation?.price ?? product.price;
  const activeImage = selectedVariation?.image || product.image;
  const activeUrl = selectedVariation?.url || product.ashkanProductUrl;
  const activeSpec = selectedVariation?.technicalSpec || product.description[lang];

  const handleAddToCart = () => {
    addItem(
      product,
      product.name[lang],
      quantity,
      selectedVariation ? { id: selectedVariation.id, name: selectedVariation.name[lang], sku: selectedVariation.sku } : undefined
    );
    showToast(t("notifications.addedToCart"), "success");
    // Stay on the current product page — do NOT navigate away automatically.
  };

  const backPath = listContext.type === "home" ? "/" : listContextToPath(listContext);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <BackButton to={backPath} label={t("product.back")} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="glass product-media h-[min(38vh,320px)] rounded-3xl p-5 sm:h-[360px] sm:p-6 md:h-[420px]">
            {activeImage ? <img src={activeImage} alt={product.name[lang]} className="h-full w-full object-contain" /> : <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("product.imageUnavailable")}</span>}
          </div>
          {activeUrl && <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="glass inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]" style={{ color: "var(--accent-1)" }}><ExternalLink size={15} />{t("product.viewOnAshkan")}</a>}
        </div>

        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold leading-8 sm:text-2xl" style={{ color: "var(--text-primary)" }}>
            {product.name[lang]}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            {available ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--chip-bg)", color: "var(--success)" }}>
                <CheckCircle2 size={13} />
                {(selectedVariation?.stockCount ?? product.stockCount) && (selectedVariation?.stockCount ?? product.stockCount)! <= 8 ? t("product.lowStock") : t("product.inStock")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--chip-bg)", color: "var(--danger)" }}>
                <XCircle size={13} />
                {t("product.outOfStock")}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>{t("product.productCode")}: {product.productCode ?? "-"}</span>
            <span>{t("product.sku")}: {selectedVariation?.sku ?? product.sku ?? "-"}</span>
            <span>{t("product.stockQuantity")}: {selectedVariation?.stockCount ?? product.stockCount ?? "-"}</span>
            <span>{t("product.packQuantity")}: {selectedVariation?.packQuantity ?? product.packQuantity ?? "-"}</span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold" style={{ color: "var(--accent-1)" }}>
              {available ? (activePrice !== undefined ? `${activePrice.toLocaleString()} ${t("product.toman")}` : t("product.priceUnknown")) : t("product.outOfStock")}
            </span>
            {product.oldPrice && (
              <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>
                {product.oldPrice.toLocaleString()}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            {activeSpec}
          </p>

          {product.features.length > 0 && (
            <div className="glass mt-5 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("product.specTitle")}</h3>
                <button type="button" onClick={() => setShowSpecs((open) => !open)} className="rounded-xl px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/10" style={{ color: "var(--accent-1)" }}>
                  {showSpecs ? t("product.less") : t("product.more")}
                </button>
              </div>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{product.features[0][lang]}</p>
              <div className={`grid transition-[grid-template-rows] duration-300 ${showSpecs ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <ul className="mt-3 flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
                    {product.features.slice(1).map((f, i) => <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-1)" }} />{f[lang]}</li>)}
                  </ul>
                </div>
              </div>
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
            {available ? (
              <button onClick={handleAddToCart} className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}>
                <ShoppingCart size={17} />
                {t("product.addToCart")}
              </button>
            ) : (
              <button type="button" className="flex flex-1 items-center justify-center rounded-2xl py-3.5 text-sm font-bold text-white" style={{ background: "linear-gradient(90deg, var(--accent-3), var(--accent-2))" }}>
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

        </div>
      </div>
    </div>
  );
}
