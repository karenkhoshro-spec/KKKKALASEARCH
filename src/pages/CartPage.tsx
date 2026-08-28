import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import BackButton from "../components/BackButton";

export default function CartPage() {
  const { t } = useLanguage();
  const { items, updateQuantity, removeItem, total } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/" />
        <h1 className="text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
          {t("cart.title")}
        </h1>
        <span />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <ShoppingBag size={44} style={{ color: "var(--text-muted)" }} />
          <p style={{ color: "var(--text-muted)" }}>{t("cart.empty")}</p>
          <Link
            to="/products"
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            {t("cart.emptyCta")}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variation?.id ?? "base"}`} className="glass flex items-center gap-4 rounded-2xl p-3 sm:p-4">
                <div className="product-media h-20 w-20 shrink-0 rounded-xl">
                  <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {item.name}
                  </h3>
                  {item.variation && (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {item.variation.name}
                    </p>
                  )}
                  {item.price !== undefined && (
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--accent-1)" }}>
                      {item.price.toLocaleString()} {t("cart.toman")}
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
                      showToast(t("notifications.removedFromCart"), "info");
                    }}
                    className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: "var(--danger)" }}
                  >
                    <Trash2 size={13} />
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-strong mt-6 flex flex-col gap-3 rounded-2xl p-5">
            <div className="flex items-center justify-between text-sm" style={{ color: "var(--text-secondary)" }}>
              <span>{items.reduce((s, i) => s + i.quantity, 0)} {t("cart.itemsCount")}</span>
              <span>{t("cart.subtotal")}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
              <span className="text-lg font-extrabold" style={{ color: "var(--accent-1)" }}>
                {total.toLocaleString()} {t("cart.toman")}
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {t("cart.total")}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row-reverse">
              <button
                onClick={() => navigate("/checkout")}
                className="flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] active:scale-95"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                {t("cart.checkout")}
              </button>
              <Link
                to="/products"
                className="glass flex-1 rounded-2xl py-3 text-center text-sm font-bold transition-transform hover:scale-[1.01] active:scale-95"
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
