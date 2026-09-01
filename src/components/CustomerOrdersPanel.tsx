import { Link } from "react-router-dom";
import { PackageSearch, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAccount } from "../context/AccountContext";
import { fetchCustomerOrders, type StoredOrder } from "../utils/ordersApi";

export default function CustomerOrdersPanel() {
  const { t, lang } = useLanguage();
  const { account } = useAccount();
  const [remote, setRemote] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!account?.phone) {
      setRemote([]);
      return;
    }
    setLoading(true);
    fetchCustomerOrders(account.phone)
      .then(setRemote)
      .catch(() => setRemote([]))
      .finally(() => setLoading(false));
  }, [account?.phone]);

  useEffect(() => {
    load();
  }, [load]);

  const locale = lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US";

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(locale);
    } catch {
      return iso;
    }
  };

  return (
    <aside
      className="glass-strong rounded-2xl p-4 sm:p-5"
      style={{ border: "1px solid var(--border-soft)" }}
    >
      <div className="mb-4 flex items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border-soft)" }}>
        <h2 className="flex items-center gap-2 text-sm font-black" style={{ color: "var(--text-primary)" }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
            <PackageSearch size={15} />
          </span>
          <span>{t("cart.yourOrders")}</span>
        </h2>
        <button
          type="button"
          onClick={load}
          aria-label="بروزرسانی سفارش‌ها"
          className="glass flex h-7 w-7 items-center justify-center rounded-lg transition-transform hover:scale-105 active:scale-95"
          style={{ color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {!account?.phone ? (
        <p className="text-xs leading-6" style={{ color: "var(--text-muted)" }}>
          {t("cart.loginToSeeOrders")}{" "}
          <Link to="/account" className="font-bold" style={{ color: "var(--accent-1)" }}>
            {t("account.loginTitle")}
          </Link>
        </p>
      ) : null}

      {account?.phone && remote.length === 0 && !loading ? (
        <p className="py-3 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          {t("account.noOrders")}
        </p>
      ) : null}

      {remote.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {remote.map((order) => (
            <div
              key={order.orderNumber}
              className="glass rounded-xl p-3"
              style={{ border: "1px solid var(--border-soft)", background: "var(--surface)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-black" dir="ltr" style={{ color: "var(--text-primary)" }}>
                  {order.orderNumber}
                </span>
                <span className="shrink-0 text-sm font-black" style={{ color: "var(--accent-1)" }}>
                  {order.total.toLocaleString()} {t("cart.toman")}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                <span dir="ltr">{formatDate(order.createdAt)}</span>
                <span
                  className="rounded-full px-2.5 py-0.5 font-bold"
                  style={{ background: "var(--chip-bg)", color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
                >
                  {t(`status.${order.status}`)}
                </span>
              </div>

              <p className="mt-1.5 text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                {t("checkout.paymentStatus")}: {t(`payment.${order.paymentStatus}`)}
              </p>

              {/* Order items */}
              <div className="mt-2.5 flex flex-col gap-2 border-t pt-2.5" style={{ borderColor: "var(--border-soft)" }}>
                {order.items.map((item, index) => (
                  <div key={`${item.sku}-${index}`} className="flex items-center gap-2.5">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--chip-bg)" }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <PackageSearch size={16} className="m-auto mt-4" style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-[11px] leading-5" style={{ color: "var(--text-primary)" }}>
                      <p className="truncate font-bold">{item.name}</p>
                      <p style={{ color: "var(--text-muted)" }}>
                        {t("product.productCode")}: {item.productCode || "-"}
                        {item.sku ? ` · ${t("product.sku")}: ${item.sku}` : ""}
                      </p>
                      {item.color || item.variation ? (
                        <p className="flex flex-wrap items-center gap-1.5 font-semibold" style={{ color: "var(--accent-1)" }}>
                          {item.colorCode ? (
                            <span
                              aria-hidden="true"
                              className="inline-block h-3 w-3 shrink-0 rounded-full border"
                              style={{
                                background: item.colorCode,
                                borderColor:
                                  item.colorCode.toLowerCase() === "#ffffff" || item.colorCode.toLowerCase() === "#f8fafc"
                                    ? "var(--border-strong)"
                                    : item.colorCode,
                              }}
                            />
                          ) : null}
                          <span>{[item.color, item.variation].filter(Boolean).join(" · ")}</span>
                        </p>
                      ) : null}
                      <p className="font-semibold">
                        {t("cart.quantity")}: {item.quantity}
                        {item.unitPrice ? ` · ${t("cart.price")}: ${item.unitPrice.toLocaleString()}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
