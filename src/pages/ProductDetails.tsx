import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ExternalLink, Minus, Plus, ShoppingCart, CheckCircle2, XCircle, Heart } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { useListContext, listContextToPath } from "../context/ListContext";
import { getProductById } from "../data/products";
import { isValidProductUrl } from "../data/csvSource";
import { markImageLoaded } from "../utils/imageLoadCache";
import { meaningfulSpec } from "../utils/specFilter";
import BackButton from "../components/BackButton";
import "../components/ProductCard.css";

export default function ProductDetails() {
  const { id = "" } = useParams();
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { isSaved, toggle } = useWishlist();
  const { listContext } = useListContext();

  const product = getProductById(id);
  const [quantity, setQuantity] = useState(1);
  const [variationId, setVariationId] = useState<string | undefined>(product?.variations?.[0]?.id);
  const [showSpecs, setShowSpecs] = useState(false);
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);

  // Reset transient view state when navigating between products (same route,
  // different param) so no stale variant/image error bleeds into the next page.
  useEffect(() => {
    setQuantity(1);
    setShowSpecs(false);
    setFailedImageSrc(null);
    setVariationId(product?.variations?.[0]?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  const selectedVariation = product.variations?.find((v) => v.id === variationId) ?? product.variations?.[0];
  const available = selectedVariation?.inStock ?? product.inStock;
  const activePrice = selectedVariation ? selectedVariation.price : product.price;

  // Product image: priority productImageUrl (mapped from the product's own Ashkan page)
  // > variant image > legacy image. Never falls back to an unrelated product's image.
  const rawActiveImage = selectedVariation?.image || product.productImageUrl || product.image || undefined;
  const activeImage = rawActiveImage && failedImageSrc !== rawActiveImage && rawActiveImage.trim() ? rawActiveImage : undefined;
  // Already-decoded images (seen on the list/cart earlier) are reused from the
  // browser cache instantly — the <link rel=preload> above prevents any wait.
  const rawActiveUrl = selectedVariation?.url || product.productUrl || product.ashkanProductUrl;
  const activeUrl = rawActiveUrl && isValidProductUrl(rawActiveUrl) ? rawActiveUrl.trim() : undefined;
  const activeSpec = meaningfulSpec(selectedVariation?.technicalSpec || product.description[lang]);
  // Specs shown to customers only when they are real text — bare CSV counts
  // ("12", "22") are legacy artifacts and never render as floating numbers.
  const allSpecifications = Array.from(new Set([
    ...product.features.map((feature) => feature[lang]),
    ...(product.variations ?? []).map((variation) => variation.technicalSpec),
  ].map((spec) => meaningfulSpec(spec)).filter(Boolean)));
  const colorVariations = (product.variations ?? []).filter((v) => v.colorName);
  const uniqueColors = Array.from(new Map(colorVariations.map((v) => [v.colorName, v])).values());

  const handleAddToCart = () => {
    addItem(
      product,
      product.name[lang],
      quantity,
      selectedVariation ? { id: selectedVariation.id, name: selectedVariation.name[lang], sku: selectedVariation.sku, price: selectedVariation.price } : undefined
    );
    showToast(t("notifications.addedToCart"), "success");
    // Stay on the current product page — do NOT navigate away automatically.
  };

  const backPath = listContext.type === "home" ? "/" : listContextToPath(listContext);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Prioritize ONLY the currently opened product image (browser dedupes
          the actual request with the <img> below — no double fetching). */}
      {activeImage && <link rel="preload" as="image" href={activeImage} fetchPriority="high" />}

      <div className="mb-5">
        <BackButton to={backPath} label={t("product.back")} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {/* Fixed compact media box → zero layout shift while the image arrives. */}
          <div className="glass product-media h-[min(38vh,320px)] rounded-3xl p-5 sm:h-[360px] sm:p-6 md:h-[420px]">
            {activeImage ? (
              <img
                key={activeImage}
                src={activeImage}
                alt={product.name[lang]}
                className="h-full w-full object-contain"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={() => markImageLoaded(activeImage)}
                onError={() => setFailedImageSrc(rawActiveImage ?? null)}
              />
            ) : (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("product.imageUnavailable")}</span>
            )}
          </div>
          {activeUrl && (
            <div className="flex flex-col gap-2">
              <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="glass inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]" style={{ color: "var(--accent-1)" }}><ExternalLink size={15} />{t("product.viewOnAshkan")}</a>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="ks-page-title leading-9 sm:leading-10" style={{ color: "var(--text-primary)" }}>
            {product.name[lang]}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            {available ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "var(--chip-bg)", color: "var(--success)" }}>
                <CheckCircle2 size={13} />
                {(selectedVariation?.stockCount ?? product.stockCount) && (selectedVariation?.stockCount ?? product.stockCount)! <= 8 ? t("product.lowStock") : t("product.inStock")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold" style={{ background: "var(--chip-bg)", color: "var(--danger)" }}>
                <XCircle size={13} />
                {t("product.outOfStock")}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 ks-meta-label" style={{ color: "var(--text-secondary)" }}>
            <span>{t("product.productCode")}: <bdi>{product.productCode ?? "-"}</bdi></span>
            <span>{t("product.sku")}: <bdi>{selectedVariation?.sku ?? product.sku ?? "-"}</bdi></span>
            <span>{t("product.stockQuantity")}: <bdi>{selectedVariation?.stockCount ?? product.stockCount ?? "-"}</bdi></span>
            <span>{t("product.packQuantity")}: <bdi>{selectedVariation?.packQuantity ?? product.packQuantity ?? "-"}</bdi></span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            {activePrice !== undefined ? <span className="text-3xl font-extrabold" style={{ color: "var(--accent-1)" }}>{activePrice.toLocaleString()} <span className="text-base font-bold" style={{ color: "var(--text-secondary)" }}>{t("product.toman")}</span></span> : <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{t("product.priceUnknown")}</span>}
          </div>

          {activeSpec && (
            <p className="mt-5 text-base leading-7" style={{ color: "var(--text-secondary)" }}>
              {activeSpec}
            </p>
          )}

          {allSpecifications.length > 0 && (
            <div className="glass mt-5 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{t("product.specTitle")}</h3>
                {allSpecifications.length > 1 && <button type="button" onClick={() => setShowSpecs((open) => !open)} className="rounded-xl px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/10" style={{ color: "var(--accent-1)" }}>
                  {showSpecs ? t("product.less") : t("product.more")}
                </button>}
              </div>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>{allSpecifications[0]}</p>
              {allSpecifications.length > 1 && <div className={`grid transition-[grid-template-rows] duration-300 ${showSpecs ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <ul className="mt-3 flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
                    {allSpecifications.slice(1).map((specification, i) => <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-1)" }} />{specification}</li>)}
                  </ul>
                </div>
              </div>}
            </div>
          )}

          {uniqueColors.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>رنگ</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((v) => (
                  <button type="button" key={v.colorName} onClick={() => setVariationId(v.id)} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-base font-medium transition-all" style={{ borderColor: variationId === v.id ? "var(--accent-1)" : "var(--border-soft)", background: variationId === v.id ? "var(--chip-bg)" : "transparent", color: "var(--text-primary)" }}>
                    <span className="h-3.5 w-3.5 rounded-full border" style={{ background: v.color, borderColor: v.color === "#f8fafc" ? "var(--border-soft)" : v.color }} />{v.colorName}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <span className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {t("product.quantity")}
            </span>
            <div className="glass flex items-center gap-3 rounded-xl px-2 py-1.5">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="decrease" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10">
                <Minus size={14} style={{ color: "var(--text-primary)" }} />
              </button>
              <span className="w-6 text-center text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {quantity}
              </span>
              <button onClick={() => setQuantity((q) => q + 1)} aria-label="increase" className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10">
                <Plus size={14} style={{ color: "var(--text-primary)" }} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {available ? (
              <button onClick={handleAddToCart} className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}>
                <ShoppingCart size={17} />
                {t("product.addToCart")}
              </button>
            ) : (
              <button type="button" className="flex flex-1 items-center justify-center rounded-2xl py-3.5 text-base font-bold text-white" style={{ background: "linear-gradient(90deg, var(--accent-3), var(--accent-2))" }}>
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
