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
import { imageRelayCandidates } from "../data/productImageResolver";
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
  const activePrice = selectedVariation ? selectedVariation.price : product.price;

  // Product image: priority productImageUrl (from product_url page) > variation image > legacy image
  const rawActiveImage = selectedVariation?.image || (product as any).productImageUrl || product.image;
  // Resilient chain: real URL direct (no-referrer) -> SAME real image via relay CDNs -> placeholder
  const relayCandidates = rawActiveImage ? imageRelayCandidates(rawActiveImage) : [];
  const [imgAttempt, setImgAttempt] = useState(0); // 0 = direct real URL, 1..n = relay CDN mirrors
  const [imgLoaded, setImgLoaded] = useState(false);
  const activeImage = rawActiveImage && imgAttempt <= relayCandidates.length
    ? imgAttempt === 0 ? rawActiveImage : relayCandidates[imgAttempt - 1]
    : undefined;
  useEffect(() => { setImgAttempt(0); setImgLoaded(false); }, [rawActiveImage]);
  // If an attempt stalls (neither load nor error), move on instead of leaving an empty box
  useEffect(() => {
    if (!rawActiveImage || imgLoaded || imgAttempt > relayCandidates.length) return;
    const timer = setTimeout(() => { setImgLoaded(false); setImgAttempt((a) => a + 1); }, 8000);
    return () => clearTimeout(timer);
  }, [rawActiveImage, activeImage, imgLoaded]);

  // Bulk mapping: productUrl via data layer, with validation
  const rawActiveUrl = selectedVariation?.url || product.productUrl || product.ashkanProductUrl;
  const activeUrl = rawActiveUrl && isValidProductUrl(rawActiveUrl) ? rawActiveUrl.trim() : undefined;
  const activeSpec = selectedVariation?.technicalSpec || product.description[lang];
  const allSpecifications = Array.from(new Set([
    ...product.features.map((feature) => feature[lang]),
    ...(product.variations ?? []).map((variation) => variation.technicalSpec).filter((spec): spec is string => Boolean(spec && spec.trim() && spec.trim() !== "-")),
  ].map((spec) => spec.trim()).filter(Boolean)));
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
      <div className="mb-5">
        <BackButton to={backPath} label={t("product.back")} />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="glass product-media h-[min(38vh,320px)] rounded-3xl p-5 sm:h-[360px] sm:p-6 md:h-[420px]">
            {activeImage ? (
              <img
                key={activeImage}
                src={activeImage}
                alt={product.name[lang]}
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onLoad={() => setImgLoaded(true)}
                onError={() => { setImgLoaded(false); setImgAttempt((a) => a + 1); }}
              />
            ) : (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("product.imageUnavailable")}</span>
            )}
          </div>
          {activeUrl && (
            <div className="flex flex-col gap-2">
              <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="glass inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]" style={{ color: "var(--accent-1)" }}><ExternalLink size={15} />{t("product.viewOnAshkan")}</a>
              <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="ks-product-details-url-cta" aria-label={`مشاهده صفحه کامل محصول ${product.name[lang]}`}>مشاهده صفحه کامل محصول ↗</a>
            </div>
          )}
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
            {activePrice !== undefined ? <span className="text-2xl font-extrabold" style={{ color: "var(--accent-1)" }}>{activePrice.toLocaleString()} {t("product.toman")}</span> : <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>{t("product.priceUnknown")}</span>}
          </div>

          <p className="mt-5 text-sm leading-7" style={{ color: "var(--text-secondary)" }}>
            {activeSpec}
          </p>

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
              <h3 className="mb-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>رنگ</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((v) => (
                  <button type="button" key={v.colorName} onClick={() => setVariationId(v.id)} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all" style={{ borderColor: variationId === v.id ? "var(--accent-1)" : "var(--border-soft)", background: variationId === v.id ? "var(--chip-bg)" : "transparent", color: "var(--text-primary)" }}>
                    <span className="h-3.5 w-3.5 rounded-full border" style={{ background: v.color, borderColor: v.color === "#f8fafc" ? "var(--border-soft)" : v.color }} />{v.colorName}
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
