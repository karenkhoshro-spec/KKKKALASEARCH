import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { LogOut, PackageSearch } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { fetchAdminOrders, patchOrderStatus, ORDER_STATUSES, type StoredOrder, type OrderStatus } from "../../utils/ordersApi";

export default function AdminOrdersPage() {
  const { t, dir, lang } = useLanguage();
  const { token, ready, logout } = useAdminAuth();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchAdminOrders(token)
      .then(setOrders)
      .catch(() => setError(t("errors.generic")));
  }, [token, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const blob = `${order.orderNumber} ${order.customer.name} ${order.customer.phone} ${order.customer.city} ${order.customer.province}`.toLowerCase();
      return blob.includes(q);
    });
  }, [orders, query]);

  if (ready && !token) return <Navigate to="/admin" replace />;

  const handleStatus = async (orderNumber: string, status: OrderStatus) => {
    if (!token) return;
    const updated = await patchOrderStatus(token, orderNumber, status);
    setOrders((prev) => prev.map((order) => (order.orderNumber === orderNumber ? updated : order)));
  };

  const dateLabel = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US");
    } catch {
      return iso;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6" dir={dir}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-base font-black sm:text-lg" style={{ color: "var(--text-primary)" }}>{t("admin.orders")}</h1>
        <button type="button" onClick={logout} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold" style={{ color: "var(--danger)" }}>
          <LogOut size={14} />
          {t("admin.logout")}
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("admin.search")}
        className="mb-4 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
        style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
      />

      {error && <p className="mb-3 text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("admin.noOrders")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const open = openId === order.orderNumber;
            return (
              <div key={order.orderNumber} className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border-soft)" }}>
                <button type="button" className="flex w-full items-center justify-between gap-3 text-start" onClick={() => setOpenId(open ? null : order.orderNumber)}>
                  <div>
                    <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{order.orderNumber}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{order.customer.name} · {order.customer.phone}</p>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                    {t(`status.${order.status}`)}
                  </span>
                </button>

                {open && (
                  <div className="mt-4 flex flex-col gap-3 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
                    <div className="grid gap-1 text-xs sm:grid-cols-2" style={{ color: "var(--text-secondary)" }}>
                      <span>{t("checkout.fullName")}: {order.customer.name}</span>
                      <span dir="ltr">{t("checkout.phone")}: {order.customer.phone}</span>
                      <span>{t("checkout.province")}: {order.customer.province}</span>
                      <span>{t("checkout.city")}: {order.customer.city}</span>
                      <span className="sm:col-span-2">{t("checkout.address")}: {order.customer.address}</span>
                      <span>{t("checkout.postalCode")}: {order.customer.postalCode}</span>
                      <span>{t("checkout.date")}: {dateLabel(order.createdAt)}</span>
                      {order.customer.notes ? <span className="sm:col-span-2">{t("checkout.notes")}: {order.customer.notes}</span> : null}
                    </div>

                    <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{t("admin.status")}</label>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatus(order.orderNumber, e.target.value as OrderStatus)}
                      className="rounded-xl px-3 py-2 text-sm outline-none"
                      style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>{t(`status.${status}`)}</option>
                      ))}
                    </select>

                    <div className="flex flex-col gap-2">
                      {order.items.map((item, index) => (
                        <div key={`${item.sku}-${index}`} className="flex items-center gap-3 rounded-xl p-2" style={{ background: "var(--chip-bg)" }}>
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                            {item.image ? (
                              <img src={item.image} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <PackageSearch size={18} className="m-auto mt-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 text-xs" style={{ color: "var(--text-primary)" }}>
                            <p className="truncate font-bold">{item.model}</p>
                            <p style={{ color: "var(--text-muted)" }}>{t("product.productCode")}: {item.productCode || "-"}</p>
                            <p style={{ color: "var(--text-muted)" }}>{t("product.sku")}: {item.sku || "-"}</p>
                            <p>{item.variation || item.color}</p>
                          </div>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "var(--accent-1)" }}>
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
