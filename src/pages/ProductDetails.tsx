import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ExternalLink, Minus, Plus, ShoppingCart, CheckCircle2, XCircle, Heart, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";
import { useListContext, listContextToPath } from "../context/ListContext";
import { getProductById } from "../data/products";
import { isValidProductUrl } from "../data/csvSource";
import { fullImageChain } from "../data/productImageResolver";
import "../components/ProductCard.css";

export default function ProductDetails() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { t, lang, dir } = useLanguage();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { isSaved, toggle } = useWishlist();
  const { listContext } = useListContext();
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const product = getProductById(id);
  // Initial quantity is strictly 0 per requirement
  const [quantity, setQuantity] = useState(0);
  const [variationId, setVariationId] = useState(product?.variations?.[0]?.id);
  const [showSpecs, setShowSpecs] = useState(false);

  const backPath = listContext.type === "home" ? "/" : listContextToPath(listContext);

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

  // Product image: priority productImageUrl > variation image > legacy image
  const rawActiveImage = selectedVariation?.image || (product as any).productImageUrl || product.image;
  // Fast-first chain (relay webp -> real site URL -> 2nd relay -> placeholder)
  const imageChain = rawActiveImage ? fullImageChain(rawActiveImage, 900) : [];
  const [imgAttempt, setImgAttempt] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const activeImage = imageChain[imgAttempt];
  useEffect(() => { setImgAttempt(0); setImgLoaded(false); }, [rawActiveImage]);
  // If an attempt stalls (neither load nor error), move on instead of leaving an empty box
  useEffect(() => {
    if (!rawActiveImage || imgLoaded || imgAttempt >= imageChain.length) return;
    const timer = setTimeout(() => { setImgLoaded(false); setImgAttempt((a) => a + 1); }, 6000);
    return () => clearTimeout(timer);
  }, [rawActiveImage, activeImage, imgLoaded]);

  // Bulk mapping: exact Ashkan URL for selected variation or product
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
    const hasColorVariants = uniqueColors.length > 0;
    const isColorSelected = !!selectedVariation && !!selectedVariation.colorName;
    const isQtySelected = quantity > 0;

    if (!isQtySelected && hasColorVariants && !isColorSelected) {
      showToast("لطفاً ابتدا تعداد موردنظر و رنگ محصول را انتخاب کنید.", "error");
      return;
    }
    if (!isQtySelected) {
      showToast("لطفاً ابتدا تعداد موردنظر را وارد کنید.", "error");
      return;
    }
    if (hasColorVariants && !isColorSelected) {
      showToast("لطفاً ابتدا یک رنگ را انتخاب کنید.", "error");
      return;
    }

    addItem(
      product,
      product.name[lang],
      quantity,
      selectedVariation ? { id: selectedVariation.id, name: selectedVariation.name[lang], sku: selectedVariation.sku, price: selectedVariation.price } : undefined
    );
    showToast(t("notifications.addedToCart") || "به سبد خرید اضافه شد", "success");
  };

  return (
    <div className="mx-auto max-w-5xl px-3.5 py-4 sm:px-6">
      {/* Overlay header with back button on the left */}
      <div
        className="mb-5 flex w-full items-center justify-between border-b pb-3.5"
        style={{ borderColor: "var(--border-soft)", direction: "ltr" }}
      >
        <button
          type="button"
          onClick={() => navigate(backPath)}
          aria-label={t("category.back") || "بازگشت"}
          className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--border-strong)",
            background: "var(--surface-strong)",
          }}
        >
          <ArrowIcon size={16} style={{ color: "var(--accent-1)" }} />
          <span dir={dir}>{t("category.back") || "بازگشت"}</span>
        </button>

        <div className="flex max-w-[70%] items-center gap-2" dir={dir}>
          <span
            className="truncate rounded-2xl px-3 py-1 text-xs font-extrabold sm:text-sm"
            style={{
              background: "var(--chip-bg)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
            }}
          >
            {product.name[lang]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {/* Compact Product Media + Ashkan Button Directly Below */}
        <div className="flex flex-col gap-3">
          <div className="glass product-media h-[min(24vh,190px)] rounded-3xl p-4 sm:h-[220px] sm:p-5 md:h-[250px]">
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
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("product.imageUnavailable")}</span>
            )}
          </div>
          {activeUrl && (
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-300 hover:scale-[1.01] active:scale-95 sm:py-3 sm:text-sm"
              style={{
                color: "var(--accent-1)",
                border: "1px solid var(--border-soft)",
                boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.12), 0 2px 10px rgba(0, 0, 0, 0.08)",
              }}
            >
              <ExternalLink size={15} />
              <span>{t("product.viewOnAshkan") || "مشاهده در سایت اشکان پلاستیک"}</span>
            </a>
          )}
        </div>

        {/* Product Details Information */}
        <div className="flex flex-col">
          <h1 className="text-lg font-extrabold leading-7 sm:text-2xl sm:leading-8" style={{ color: "var(--text-primary)" }}>
            {product.name[lang]}
          </h1>

          <div className="mt-2.5 flex items-center gap-2">
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

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>{t("product.productCode")}: {product.productCode ?? "-"}</span>
            <span>{t("product.sku")}: {selectedVariation?.sku ?? product.sku ?? "-"}</span>
            <span>{t("product.stockQuantity")}: {selectedVariation?.stockCount ?? product.stockCount ?? "-"}</span>
            <span>{t("product.packQuantity")}: {selectedVariation?.packQuantity ?? product.packQuantity ?? "-"}</span>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            {available && activePrice !== undefined ? (
              <span className="text-xl font-extrabold sm:text-2xl" style={{ color: "var(--accent-1)" }}>
                {activePrice.toLocaleString()} {t("product.toman")}
              </span>
            ) : available ? (
              <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                {t("product.priceUnknown")}
              </span>
            ) : null}
          </div>

          {activeSpec && activeSpec !== "-" && (
            <p className="mt-4 text-xs leading-6 sm:text-sm sm:leading-7" style={{ color: "var(--text-secondary)" }}>
              {activeSpec}
            </p>
          )}

          {/* Collapsible specifications */}
          {allSpecifications.length > 0 && (
            <div className="glass mt-4 rounded-2xl p-3.5" style={{ border: "1px solid var(--border-soft)" }}>
              <button
                type="button"
                onClick={() => setShowSpecs((open) => !open)}
                className="flex w-full items-center justify-between gap-3 text-start transition-opacity hover:opacity-85"
                aria-expanded={showSpecs}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold sm:text-sm" style={{ color: "var(--text-primary)" }}>{t("product.specTitle") || "مشخصات محصول"}</h3>
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
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-bold sm:text-sm" style={{ color: "var(--text-primary)" }}>رنگ</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((v) => (
                  <button
                    type="button"
                    key={v.colorName}
                    onClick={() => setVariationId(v.id)}
                    className="flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all sm:text-sm"
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
          <div className="mt-5 flex items-center gap-4">
            <span className="text-xs font-semibold sm:text-sm" style={{ color: "var(--text-primary)" }}>
              {t("product.quantity")}
            </span>
            <div className="glass flex items-center gap-3 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                aria-label="کاهش تعداد"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:scale-90"
              >
                <Minus size={14} style={{ color: "var(--text-primary)" }} />
              </button>
              <span className="w-6 text-center text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="افزایش تعداد"
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10 active:scale-90"
              >
                <Plus size={14} style={{ color: "var(--text-primary)" }} />
              </button>
            </div>
          </div>

          {/* Add to cart & Wishlist buttons */}
          <div className="mt-5 flex items-center gap-3">
            {available ? (
              <button
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-[var(--shadow-glow)] transition-transform duration-300 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3.5 sm:text-sm"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                <ShoppingCart size={17} />
                {t("product.addToCart")}
              </button>
            ) : (
              <button
                type="button"
                className="flex flex-1 items-center justify-center rounded-2xl py-3 text-xs font-bold text-white sm:py-3.5 sm:text-sm"
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
              className="glass flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl transition-transform hover:scale-105 active:scale-95 sm:h-[52px] sm:w-[52px]"
            >
              <Heart size={19} fill={isSaved(product.id) ? "var(--accent-3)" : "none"} style={{ color: isSaved(product.id) ? "var(--accent-3)" : "var(--text-secondary)" }} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
