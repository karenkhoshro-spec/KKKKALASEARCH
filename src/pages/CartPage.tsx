import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";

export default function CartPage() {
  const { t, dir } = useLanguage();
  const { items, updateQuantity, removeItem, total } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
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
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
            <ShoppingCart size={18} />
          </div>
          <h1 className="text-base font-extrabold sm:text-lg" style={{ color: "var(--text-primary)" }}>
            {t("cart.title")}
          </h1>
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
            className="rounded-2xl px-5 py-2.5 text-xs font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-105 active:scale-95 sm:text-sm"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            {t("cart.emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variation?.id ?? "base"}`}
                className="glass flex items-center gap-3.5 rounded-2xl p-3 sm:p-4"
                style={{ border: "1px solid var(--border-soft)" }}
              >
                <div className="product-media h-20 w-20 shrink-0 rounded-xl">
                  <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
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
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/10"
                    >
                      <Minus size={12} style={{ color: "var(--text-primary)" }} />
                    </button>
                    <span className="w-5 text-center text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variation?.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/10"
                    >
                      <Plus size={12} style={{ color: "var(--text-primary)" }} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      removeItem(item.productId, item.variation?.id);
                      showToast(t("notifications.removedFromCart") || "از سبد خرید حذف شد", "info");
                    }}
                    className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--danger)" }}
                  >
                    <Trash2 size={13} />
                    <span>{t("cart.remove")}</span>
                  </button>
                </div>
              </div>
            ))}
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
                className="flex-1 rounded-2xl py-3 text-xs font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] active:scale-95 sm:text-sm"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                {t("cart.checkout")}
              </button>
              <Link
                to="/products"
                className="glass flex-1 rounded-2xl py-3 text-center text-xs font-bold transition-transform hover:scale-[1.01] active:scale-95 sm:text-sm"
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
