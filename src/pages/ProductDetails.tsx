import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ExternalLink, Minus, Plus, ShoppingCart, CheckCircle2, XCircle, Heart, Share2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { useListContext, listContextToPath } from "../context/ListContext";
import { getProductById } from "../data/products";
import { isValidProductUrl } from "../data/csvSource";
import { fullImageChain } from "../data/productImageResolver";
import { goBack } from "../utils/safeBack";
import { shareOrCopyUrl } from "../utils/share";
import OverlayHeader from "../components/OverlayHeader";
import { qtyForVariation, setQtyForVariation } from "../utils/variationQuantity";
import "../components/ProductCard.css";

export default function ProductDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { isSaved, toggle } = useWishlist();
  const { listContext } = useListContext();
  const product = getProductById(id);
  const [qtyByVariation, setQtyByVariation] = useState<Record<string, number>>({});
  const [variationId, setVariationId] = useState<string | undefined>(product?.variations?.[0]?.id);
  const [showSpecs, setShowSpecs] = useState(false);
  const [imgAttempt, setImgAttempt] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (product?.variations?.[0]?.id) {
      setVariationId(product.variations[0].id);
    }
    setQtyByVariation({});
  }, [product?.id]);

  const selectedVariation = product?.variations?.find((v) => v.id === variationId);
  const quantity = qtyForVariation(qtyByVariation, selectedVariation?.id);
  const rawActiveImage = selectedVariation?.image || (product as any)?.productImageUrl || product?.image;
  const imageChain = rawActiveImage ? fullImageChain(rawActiveImage, 900) : [];
  const activeImage = imageChain[imgAttempt];

  useEffect(() => {
    setImgAttempt(0);
    setImgLoaded(false);
  }, [rawActiveImage]);

  useEffect(() => {
    if (!rawActiveImage || imgLoaded || imgAttempt >= imageChain.length) return;
    const timer = setTimeout(() => { setImgLoaded(false); setImgAttempt((a) => a + 1); }, 6000);
    return () => clearTimeout(timer);
  }, [rawActiveImage, activeImage, imgLoaded, imgAttempt, imageChain.length]);

  const backPath = listContext.type === "home" ? "/" : listContextToPath(listContext);

  const handleBack = () => {
    goBack(navigate, backPath || "/");
  };

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

  const available = selectedVariation?.inStock ?? product.inStock;
  const activePrice = selectedVariation ? selectedVariation.price : product.price;

  // Strict Ashkan URL resolution matching product / variant
  const rawActiveUrl = selectedVariation?.url || product.productUrl || product.ashkanProductUrl;
  const activeUrl = rawActiveUrl && isValidProductUrl(rawActiveUrl) ? rawActiveUrl.trim() : undefined;

  // Move pack quantity and genuine specs inside full specifications list; filter out stray numbers
  const activePackQty = selectedVariation?.packQuantity ?? product.packQuantity;
  const allSpecifications = Array.from(new Set([
    ...(activePackQty && String(activePackQty).trim() && String(activePackQty).trim() !== "-"
      ? [`تعداد در بسته: ${activePackQty}`]
      : []),
    ...product.features.map((feature) => feature[lang]),
    ...(product.variations ?? [])
      .map((variation) => variation.technicalSpec)
      .filter((spec): spec is string => Boolean(
        spec &&
        spec.trim() &&
        spec.trim() !== "-" &&
        !/^\d+$/.test(spec.trim()) &&
        spec.trim() !== "اشکان اشکان"
      )),
  ].map((spec) => spec.trim()).filter(Boolean)));

  const colorVariations = (product.variations ?? []).filter((v) => v.colorName);
  const uniqueColors = Array.from(new Map(colorVariations.map((v) => [v.colorName, v])).values());

  const handleAddToCart = () => {
    const hasColorVariants = uniqueColors.length > 0;
    const cartLines = hasColorVariants
      ? uniqueColors
          .map((v) => ({ v, q: qtyForVariation(qtyByVariation, v.id) }))
          .filter((line) => line.q > 0)
      : [{ v: selectedVariation, q: quantity }].filter((line) => line.q > 0);

    if (cartLines.length === 0) {
      showToast(
        hasColorVariants
          ? "لطفاً ابتدا تعداد موردنظر و رنگ محصول را انتخاب کنید."
          : "لطفاً ابتدا تعداد موردنظر را وارد کنید.",
        "error",
      );
      return;
    }

    for (const { v, q } of cartLines) {
      addItem(
        product,
        product.name[lang],
        q,
        v
          ? {
              id: v.id,
              name: v.name[lang],
              sku: v.sku,
              price: v.price,
              color: v.colorName,
              image: v.image || product.productImageUrl,
            }
          : undefined,
      );
    }
    showToast(t("notifications.addedToCart") || "به سبد خرید اضافه شد", "success");
  };

  const productCodeVal = product.productCode ?? product.id ?? "-";
  const stockSkuVal = selectedVariation?.sku ?? product.sku ?? "-";

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6">
      {activeImage && (
        <link rel="preload" as="image" href={activeImage} fetchPriority="high" referrerPolicy="no-referrer" />
      )}
      <OverlayHeader onBack={handleBack} />

      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {/* 2. Left Column: Media Box with Product Code & Stock SKU inside the frame at the BOTTOM (one right, one left) + Ashkan CTA */}
        <div className="flex flex-col gap-3">
          <div
            className="glass-strong relative flex flex-col justify-between overflow-hidden rounded-3xl p-3.5 sm:p-4"
            style={{
              border: "1.2px solid var(--border-strong)",
              background: "var(--surface-strong)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.12)",
            }}
          >
            {/* Clean, unobstructed Product Image Area */}
            <div className="product-media relative flex h-[210px] w-full items-center justify-center overflow-hidden rounded-2xl p-2 sm:h-[250px] md:h-[280px]">
              {activeImage ? (
                <img
                  key={activeImage}
                  src={activeImage}
                  alt={product.name[lang]}
                  className="h-full w-full object-contain"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgLoaded(false); setImgAttempt((a) => a + 1); }}
                />
              ) : (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("product.imageUnavailable")}</span>
              )}
            </div>

            {/* Bottom Info Strip inside Image Card: Right = Product Code, Left = Stock SKU */}
            <div className="mt-3 flex w-full items-center justify-between gap-2 border-t pt-2.5 text-xs" style={{ borderColor: "var(--border-soft)" }}>
              <div
                className="glass flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-soft)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  {t("product.productCode") || "کد محصول"}:
                </span>
                <span>{productCodeVal}</span>
              </div>

              <div
                className="glass flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-soft)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  {t("product.sku") || "شناسه کالا"}:
                </span>
                <span>{stockSkuVal}</span>
              </div>
            </div>
          </div>

          {/* Ashkan Plastic External Link CTA */}
          {activeUrl && (
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("product.viewOnAshkan") || "مشاهده محصول در سایت اشکان پلاستیک ↗"}
              className="ks-ashkan-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-300 active:scale-95 sm:py-3 sm:text-sm"
            >
              <ExternalLink size={16} />
              <span>{t("product.viewOnAshkan") || "مشاهده محصول در سایت اشکان پلاستیک"} ↗</span>
            </a>
          )}
        </div>

        {/* 3. Right Column: Product Details Information */}
        <div className="flex flex-col gap-4">
          {/* Main Product Summary Crystal Card */}
          <div
            className="glass-strong rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 transition-all"
            style={{
              border: "1.2px solid var(--border-strong)",
              background: "var(--surface-strong)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.12)",
            }}
          >
            {/* Product Name Title & Status Badge */}
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-black leading-8 sm:text-2xl sm:leading-9 tracking-tight" style={{ color: "var(--text-primary)" }}>
                {product.name[lang]}
              </h1>

              {/* Status Badge */}
              <div className="flex items-center">
                {available ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all sm:text-sm"
                    style={{
                      background: "rgba(34, 197, 94, 0.14)",
                      color: "var(--success)",
                      border: "1px solid rgba(34, 197, 94, 0.35)",
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>
                      {(selectedVariation?.stockCount ?? product.stockCount) && (selectedVariation?.stockCount ?? product.stockCount)! <= 8
                        ? t("product.lowStock")
                        : t("product.inStock")}
                    </span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition-all sm:text-sm"
                    style={{
                      background: "rgba(244, 63, 94, 0.14)",
                      color: "var(--danger)",
                      border: "1px solid rgba(244, 63, 94, 0.35)",
                    }}
                  >
                    <XCircle size={15} />
                    <span>{t("product.outOfStock") || "ناموجود"}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Price Row inside Summary Card */}
            <div className="flex items-baseline justify-between pt-2 border-t" style={{ borderColor: "var(--border-soft)" }}>
              <span className="text-xs font-semibold sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                {t("product.price") || "قیمت واحد"}
              </span>
              {available && activePrice !== undefined ? (
                <span className="text-xl font-black sm:text-2xl" style={{ color: "var(--accent-1)" }}>
                  {activePrice.toLocaleString()} {t("product.toman")}
                </span>
              ) : available ? (
                <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                  {t("product.priceUnknown")}
                </span>
              ) : (
                <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                  -
                </span>
              )}
            </div>
          </div>

          {/* Technical Specifications Accordion (Contains Pack Quantity and Real Specifications) */}
          {allSpecifications.length > 0 && (
            <div className="glass rounded-2xl p-3.5" style={{ border: "1px solid var(--border-soft)" }}>
              <button
                type="button"
                onClick={() => setShowSpecs((open) => !open)}
                className="flex w-full items-center justify-between gap-3 text-start transition-opacity hover:opacity-85 cursor-pointer"
                aria-expanded={showSpecs}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold sm:text-sm" style={{ color: "var(--text-primary)" }}>{t("product.specTitle") || "مشخصات کامل"}</h3>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                    {allSpecifications.length}
                  </span>
                </div>
                <span className="text-xs font-bold transition-transform duration-300" style={{ color: "var(--accent-1)", transform: showSpecs ? "rotate(180deg)" : "rotate(0deg)" }}>
                  ▼
                </span>
              </button>
              {showSpecs && (
                <div className="mt-3 max-h-56 overflow-y-auto border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
                  <ul className="flex flex-col gap-2">
                    {allSpecifications.map((specification, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs leading-5 sm:text-sm sm:leading-6" style={{ color: "var(--text-secondary)" }}>
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent-1)" }} />
                        <span>{specification}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Color variations if available */}
          {uniqueColors.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold sm:text-sm" style={{ color: "var(--text-primary)" }}>{t("product.color")}</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((v) => (
                  <button
                    type="button"
                    key={v.colorName}
                    onClick={() => setVariationId(v.id)}
                    className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all sm:text-sm cursor-pointer"
                    style={{
                      borderColor: variationId === v.id ? "var(--accent-1)" : "var(--border-soft)",
                      background: variationId === v.id ? "var(--chip-bg)" : "transparent",
                      color: "var(--text-primary)",
                      boxShadow: variationId === v.id ? "0 0 12px var(--accent-glow)" : "none",
                    }}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border"
                      style={{ background: v.color, borderColor: v.color === "#f8fafc" ? "var(--border-soft)" : v.color }}
                    />
                    {v.colorName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity selector: initial 0, [-] [0] [+] */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold sm:text-sm" style={{ color: "var(--text-primary)" }}>
              {t("product.quantity")}
            </span>
            <div className="glass flex items-center gap-3 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setQtyByVariation((map) => setQtyForVariation(map, selectedVariation?.id, quantity - 1))}
                aria-label="کاهش تعداد"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:scale-90 cursor-pointer"
              >
                <Minus size={14} style={{ color: "var(--text-primary)" }} />
              </button>
              <span className="w-6 text-center text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQtyByVariation((map) => setQtyForVariation(map, selectedVariation?.id, quantity + 1))}
                aria-label="افزایش تعداد"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:scale-90 cursor-pointer"
              >
                <Plus size={14} style={{ color: "var(--text-primary)" }} />
              </button>
            </div>
          </div>

          {/* Add to cart & Wishlist buttons */}
          <div className="flex items-center gap-3">
            {available ? (
              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5 sm:text-sm cursor-pointer"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                <ShoppingCart size={17} />
                {t("product.addToCart")}
              </button>
            ) : (
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-2xl py-3 text-xs font-bold text-white sm:py-3.5 sm:text-sm cursor-pointer"
                style={{ background: "linear-gradient(90deg, var(--accent-3), var(--accent-2))" }}
              >
                {t("product.requestProduction")}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const added = toggle(product.id);
                showToast(added ? t("notifications.addedToWishlist") : t("notifications.removedFromWishlist"), "info");
              }}
              aria-label="wishlist"
              className="glass flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl transition-transform hover:scale-105 active:scale-95 sm:h-[52px] sm:w-[52px] cursor-pointer"
            >
              <Heart size={19} fill={isSaved(product.id) ? "var(--accent-3)" : "none"} style={{ color: isSaved(product.id) ? "var(--accent-3)" : "var(--text-secondary)" }} />
            </button>
            <button
              type="button"
              onClick={async () => {
                const result = await shareOrCopyUrl(`${window.location.origin}/product/${product.id}`);
                if (result === "copied") showToast(t("notifications.linkCopied"), "success");
              }}
              aria-label={t("product.share")}
              className="glass flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl transition-transform hover:scale-105 active:scale-95 sm:h-[52px] sm:w-[52px] cursor-pointer"
            >
              <Share2 size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
