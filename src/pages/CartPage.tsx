import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { fullImageChain } from "../data/productImageResolver";

export default function CartPage() {
  const { t, dir } = useLanguage();
  const { items, updateQuantity, removeItem, total } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6" dir={dir}>
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
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
              <ShoppingCart size={16} />
            </div>
            <h1 className="truncate text-xs font-black sm:text-sm md:text-base" style={{ color: "var(--text-primary)" }}>
              {t("cart.title")}
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-end">
          {items.length > 0 ? (
            <span
              className="glass rounded-full px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:text-xs"
              style={{
                background: "var(--chip-bg)",
                color: "var(--accent-1)",
                border: "1px solid var(--border-soft)",
              }}
            >
              {items.reduce((s, i) => s + i.quantity, 0)} {t("cart.itemsCount") || "قلم"}
            </span>
          ) : (
            <div className="w-4" />
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "var(--chip-bg)", color: "var(--text-muted)" }}>
            <ShoppingBag size={36} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("cart.empty")}
          </p>
          <Link
            to="/products"
            className="rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-105 active:scale-95 sm:text-sm cursor-pointer"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            {t("cart.emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const imageSrc = item.image ? fullImageChain(item.image, 240)[0] : undefined;
              return (
                <div
                  key={`${item.productId}-${item.variation?.id ?? "base"}`}
                  className="glass flex items-center gap-3.5 rounded-2xl p-3 sm:p-4"
                  style={{ border: "1px solid var(--border-soft)" }}
                >
                  <div className="product-media h-20 w-20 shrink-0 rounded-xl">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t("product.imageUnavailable")}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {item.name}
                    </h3>
                    {item.variation && (
                      <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--accent-1)" }}>
                        {item.variation.name}
                      </p>
                    )}
                    {item.price !== undefined ? (
                      <p className="mt-1 text-sm font-extrabold" style={{ color: "var(--accent-1)" }}>
                        {item.price.toLocaleString()} {t("cart.toman")}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                        استعلام / نامشخص
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="glass flex items-center gap-2 rounded-xl px-1.5 py-1">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variation?.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/10 cursor-pointer"
                      >
                        <Minus size={12} style={{ color: "var(--text-primary)" }} />
                      </button>
                      <span className="w-5 text-center text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variation?.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/10 cursor-pointer"
                      >
                        <Plus size={12} style={{ color: "var(--text-primary)" }} />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        removeItem(item.productId, item.variation?.id);
                        showToast(t("notifications.removedFromCart") || "از سبد خرید حذف شد", "info");
                      }}
                      className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70 cursor-pointer"
                      style={{ color: "var(--danger)" }}
                    >
                      <Trash2 size={13} />
                      <span>{t("cart.remove")}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass-strong mt-6 flex flex-col gap-3 rounded-2xl p-5" style={{ border: "1px solid var(--border-soft)" }}>
            <div className="flex items-center justify-between text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
              <span>{items.reduce((s, i) => s + i.quantity, 0)} {t("cart.itemsCount")}</span>
              <span>{t("cart.subtotal")}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
              <span className="text-base font-extrabold sm:text-lg" style={{ color: "var(--accent-1)" }}>
                {total.toLocaleString()} {t("cart.toman")}
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {t("cart.total")}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                onClick={() => navigate("/checkout")}
                className="flex-1 rounded-2xl py-3 text-xs font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] active:scale-95 sm:text-sm cursor-pointer"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                {t("cart.checkout")}
              </button>
              <Link
                to="/products"
                className="glass flex-1 rounded-2xl py-3 text-center text-xs font-bold transition-transform hover:scale-[1.01] active:scale-95 sm:text-sm cursor-pointer"
                style={{ color: "var(--text-primary)" }}
              >
                {t("cart.continueShopping")}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
