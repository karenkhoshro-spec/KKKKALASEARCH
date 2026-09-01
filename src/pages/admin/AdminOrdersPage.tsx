import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Eye, FileDown, LogOut, PackageSearch } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { fetchAdminOrders, patchOrderStatus, ORDER_STATUSES, type StoredOrder, type OrderStatus } from "../../utils/ordersApi";
import { downloadStoredOrderPdf, orderPdfLabels, viewStoredOrderPdf } from "../../utils/orderPdf";
import ProductImage from "../../components/ProductImage";

export default function AdminOrdersPage() {
  const { t, dir, lang } = useLanguage();
  const { token, ready, logout } = useAdminAuth();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busyPdf, setBusyPdf] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchAdminOrders(token)
      .then((list) => {
        if (cancelled) return;
        setOrders(list);
        setError("");
      })
      .catch(() => {
        if (cancelled) return;
        // A rejected fetch (not a 401/empty list) means the orders API itself is
        // not reachable — say so, otherwise an empty screen looks like
        // "the customer's order disappeared".
        setError(t("admin.apiUnavailable"));
      });
    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const blob = `${order.orderNumber} ${order.customer.name} ${order.customer.phone} ${order.customer.email || ""} ${order.customer.city} ${order.customer.province}`.toLowerCase();
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

  const pdfOpts = () => ({
    dir,
    currency: t("cart.toman"),
    labels: orderPdfLabels(t),
  });

  const handleViewPdf = async (order: StoredOrder) => {
    setBusyPdf(order.orderNumber);
    try {
      const { dir: pdfDir, currency, labels } = pdfOpts();
      await viewStoredOrderPdf(order, pdfDir, currency, labels);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusyPdf("");
    }
  };

  const handleDownloadPdf = async (order: StoredOrder) => {
    setBusyPdf(order.orderNumber);
    try {
      const { dir: pdfDir, currency, labels } = pdfOpts();
      await downloadStoredOrderPdf(order, pdfDir, currency, labels);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusyPdf("");
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

      {error && orders.length > 0 ? <p className="mb-3 text-xs" style={{ color: "var(--danger)" }}>{error}</p> : null}

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: error ? "var(--danger)" : "var(--text-muted)" }}>
          {error || t("admin.noOrders")}
        </p>
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
                      {order.customer.email ? <span dir="ltr">{t("checkout.email")}: {order.customer.email}</span> : null}
                      <span>{t("checkout.province")}: {order.customer.province}</span>
                      <span>{t("checkout.city")}: {order.customer.city}</span>
                      <span className="sm:col-span-2">{t("checkout.address")}: {order.customer.address}</span>
                      <span>{t("checkout.postalCode")}: {order.customer.postalCode}</span>
                      <span>{t("checkout.date")}: {dateLabel(order.createdAt)}</span>
                      <span>{t("checkout.paymentStatus")}: {t(`payment.${order.paymentStatus}`)}</span>
                      <span>{t("admin.status")}: {t(`status.${order.status}`)}</span>
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

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyPdf === order.orderNumber}
                        onClick={() => handleViewPdf(order)}
                        className="glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        <Eye size={14} />
                        {t("admin.viewPdf")}
                      </button>
                      <button
                        type="button"
                        disabled={busyPdf === order.orderNumber}
                        onClick={() => handleDownloadPdf(order)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white"
                        style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
                      >
                        <FileDown size={14} />
                        {t("admin.downloadPdf")}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {order.items.map((item, index) => (
                        <div key={`${item.sku}-${index}`} className="flex items-center gap-3 rounded-xl p-2" style={{ background: "var(--chip-bg)" }}>
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl" style={{ background: "var(--surface)" }}>
                            <ProductImage
                              src={item.image}
                              alt={item.name || item.model || item.productId}
                              size={160}
                              fallback={<PackageSearch size={18} />}
                            />
                          </div>
                          <div className="min-w-0 flex-1 text-xs" style={{ color: "var(--text-primary)" }}>
                            <p className="truncate font-bold">{item.name || item.model}</p>
                            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1" style={{ color: "var(--text-muted)" }}>
                              <span>{t("admin.productId")}: <span dir="ltr">{item.productId || "-"}</span></span>
                              <span aria-hidden="true">·</span>
                              <span>{t("product.productCode")}: <span dir="ltr">{item.productCode || "-"}</span></span>
                            </p>
                            <p style={{ color: "var(--text-muted)" }}>{t("product.sku")}: <span dir="ltr">{item.sku || "-"}</span></p>
                            {item.variation ? (
                              <p style={{ color: "var(--text-muted)" }}>{t("product.variation")}: {item.variation}</p>
                            ) : null}
                            {item.availability ? (
                              <p className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                                  {t("admin.availability")}:
                                </span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[10px] font-black"
                                  style={
                                    item.availability === "موجود"
                                      ? { background: "rgba(34,197,94,0.14)", color: "#15803d", border: "1px solid rgba(34,197,94,0.4)" }
                                      : { background: "rgba(239,68,68,0.14)", color: "#b91c1c", border: "1px solid rgba(239,68,68,0.4)" }
                                  }
                                >
                                  {item.availability === "موجود" ? t("product.inStock") : t("product.outOfStock")}
                                  {item.stockCount ? ` (${item.stockCount.toLocaleString("en-US")})` : ""}
                                </span>
                              </p>
                            ) : null}
                            {(item.color || item.variation) ? (
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
                                <span>
                                  {t("product.color")}: {item.color || item.variation}
                                </span>
                                <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                                  {t("cart.quantity")}: {item.quantity}
                                </span>
                              </p>
                            ) : (
                              <p className="font-semibold">{t("cart.quantity")}: {item.quantity}</p>
                            )}
                            <p className="font-semibold">
                              {t("cart.price")}: {(item.unitPrice ?? item.price).toLocaleString()} {t("cart.toman")}
                            </p>
                            <p className="font-semibold" style={{ color: "var(--accent-1)" }}>
                              {t("cart.lineTotal")}: {item.lineTotal.toLocaleString()} {t("cart.toman")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-end text-sm font-black" style={{ color: "var(--accent-1)" }}>
                      {t("cart.total")}: {order.total.toLocaleString()} {t("cart.toman")}
                    </p>
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
