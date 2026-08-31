import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ClipboardList } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAccount } from "../context/AccountContext";
import BackButton from "../components/BackButton";
import CustomerOrdersPanel from "../components/CustomerOrdersPanel";
import { ORDER_STATUSES } from "../utils/api";

export default function CartPage() {
  const { t } = useLanguage();
  const { items, updateQuantity, removeItem, total } = useCart();
  const { showToast } = useToast();
  const { account } = useAccount();

  useEffect(() => {
    document.title = t("cart.title") + " | Kala Search";
  }, [t]);

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
              <div
                key={`${item.productId}-${item.variation?.id ?? "base"}`}
                className="glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
              >
                {/* image */}
                <div className="product-media h-24 w-24 shrink-0 self-center rounded-xl sm:self-start">
                  <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                </div>

                {/* full line details: name, code, SKU, color, variation, unit price, line total */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {item.name}
                    </h3>
                    <OrderStatusChipLikePill text={item.productCode} />
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.productCode && (
                      <span dir="ltr">
                        {t("cart.productCode")}: <b style={{ color: "var(--text-secondary)" }}>{item.productCode}</b>
                      </span>
                    )}
                    {item.sku && (
                      <span dir="ltr">
                        SKU: <b style={{ color: "var(--text-secondary)" }}>{item.sku}</b>
                      </span>
                    )}
                    {item.model && (
                      <span dir="ltr">
                        {t("cart.model")}: <b style={{ color: "var(--text-secondary)" }}>{item.model}</b>
                      </span>
                    )}
                    {item.variation && (
                      <span className="inline-flex items-center gap-1.5">
                        {t("cart.color")}
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: item.variation.color ?? "var(--accent-1)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" }}
                        />
                        <b style={{ color: "var(--text-secondary)" }}>{item.variation.name}</b>
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("cart.unitPrice")}:{" "}
                      <b className="text-sm" style={{ color: "var(--text-primary)" }}>
                        {item.price.toLocaleString()}
                      </b>{" "}
                      {t("cart.toman")}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {t("cart.lineTotal")}:{" "}
                      <b className="text-sm" style={{ color: "var(--accent-1)" }}>
                        {(item.price * item.quantity).toLocaleString()}
                      </b>{" "}
                      {t("cart.toman")}
                    </span>
                  </div>
                </div>

                {/* qty + remove */}
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <div className="glass flex items-center gap-2 rounded-xl px-1.5 py-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variation?.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10"
                      aria-label="decrease"
                    >
                      <Minus size={12} style={{ color: "var(--text-primary)" }} />
                    </button>
                    <span className="w-5 text-center text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variation?.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/10"
                      aria-label="increase"
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
              <span>
                {items.reduce((s, i) => s + i.quantity, 0)} {t("cart.itemsCount")}
              </span>
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
              <Link
                id="checkout-entry"
                to="/checkout"
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] active:scale-95"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                <ClipboardList size={16} />
                {t("cart.checkout")}
              </Link>
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

      {/* «سفارشات شما» — customer's registered orders, straight from the API */}
      <CustomerOrdersPanel initialMobile={account?.phone} statuses={ORDER_STATUSES} />
    </div>
  );
}

function OrderStatusChipLikePill({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
      style={{ background: "var(--chip-bg)", color: "var(--text-secondary)" }}
      dir="ltr"
    >
      {text}
    </span>
  );
}
