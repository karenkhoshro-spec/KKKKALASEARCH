import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ShoppingCart } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { goBack } from "../utils/safeBack";
import { fullImageChain } from "../data/productImageResolver";
import { getProductById } from "../data/products";
import OverlayHeader from "../components/OverlayHeader";
import CustomerOrdersPanel from "../components/CustomerOrdersPanel";

export default function CartPage() {
  const { t, lang } = useLanguage();
  const { items, updateQuantity, removeItem, total } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleBack = () => {
    goBack(navigate);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <OverlayHeader
        onBack={handleBack}
        title={
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
            <h1 className="truncate text-xs font-black sm:text-sm" style={{ color: "var(--text-primary)" }}>
              {t("cart.title")}
            </h1>
          </div>
        }
        leading={
          items.length > 0 ? (
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
          )
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
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
          <div className="flex flex-col gap-2.5">
            {items.map((item) => {
              const imageSrc = item.image ? fullImageChain(item.image, 240)[0] : undefined;
              const product = getProductById(item.productId);
              const sku = item.variation?.sku ?? product?.sku;
              const productCode = product?.productCode ?? item.productId;
              const color = item.variation?.color;
              const variationName = item.variation?.name;
              const model = product?.name?.[lang];
              const unit = item.price;
              const lineTotal = unit !== undefined ? unit * item.quantity : undefined;
              return (
                <div
                  key={`${item.productId}-${item.variation?.id ?? "base"}`}
                  className="glass flex items-start gap-2.5 rounded-2xl p-2.5 sm:items-center sm:gap-3 sm:p-3"
                  style={{ border: "1px solid var(--border-soft)" }}
                >
                  <div className="product-media h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-[4.5rem] sm:w-[4.5rem]">
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
                  <div className="min-w-0 flex-1 text-[11px] leading-5 sm:text-xs">
                    <h3 className="truncate text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {item.name}
                    </h3>
                    {model && model !== item.name && (
                      <p style={{ color: "var(--text-muted)" }}>{model}</p>
                    )}
                    <p style={{ color: "var(--text-muted)" }}>
                      {t("product.productCode")}: {productCode}
                      {sku ? ` · ${t("product.sku")}: ${sku}` : ""}
                    </p>
                    {color ? (
                      <p className="font-semibold" style={{ color: "var(--accent-1)" }}>
                        {t("product.color")}: {color}
                      </p>
                    ) : null}
                    {variationName && variationName !== color ? (
                      <p className="font-semibold" style={{ color: "var(--accent-1)" }}>
                        {t("product.variation")}: {variationName}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-bold" style={{ color: "var(--text-primary)" }}>
                      <span>{t("cart.quantity")}: {item.quantity}</span>
                      {unit !== undefined ? (
                        <span>{t("cart.price")}: {unit.toLocaleString()} {t("cart.toman")}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>استعلام / نامشخص</span>
                      )}
                      {lineTotal !== undefined ? (
                        <span style={{ color: "var(--accent-1)" }}>
                          {t("cart.lineTotal")}: {lineTotal.toLocaleString()} {t("cart.toman")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
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
      <CustomerOrdersPanel />
      </div>
    </div>
  );
}
