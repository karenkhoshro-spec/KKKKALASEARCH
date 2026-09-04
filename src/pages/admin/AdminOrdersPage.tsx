import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FileDown, LogOut, PackageCheck, Truck, Wallet, SearchX, ClipboardList, Home } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { fetchAdminOrders, patchOrderStatus, ORDER_STATUSES, type StoredOrder, type OrderStatus } from "../../utils/ordersApi";
import { downloadStoredOrderPdf, orderPdfLabels } from "../../utils/orderPdf";
import OrderItemImage from "../../components/OrderItemImage";

type StatusFilter = "all" | OrderStatus;

export default function AdminOrdersPage() {
  const { t, dir, lang } = useLanguage();
  const { token, ready, logout } = useAdminAuth();
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busyPdf, setBusyPdf] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchAdminOrders(token)
      .then(setOrders)
      .catch(() => setError(t("errors.generic")));
  }, [token, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;
      const blob = `${order.orderNumber} ${order.customer.name} ${order.customer.phone} ${order.customer.email || ""} ${order.customer.city} ${order.customer.province || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [orders, query, statusFilter]);

  const summary = useMemo(() => {
    const total = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const pending = orders.filter((order) => ["preparing", "ready_pickup", "shipping"].includes(order.status)).length;
    const counts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, orders.filter((order) => order.status === status).length])) as Record<OrderStatus, number>;
    return { total, revenue, delivered, pending, counts };
  }, [orders]);

  if (ready && !token) return <Navigate to="/admin" replace />;

  const handleStatus = async (orderNumber: string, status: OrderStatus) => {
    if (!token) return;
    try {
      const updated = await patchOrderStatus(token, orderNumber, status);
      setOrders((prev) => prev.map((order) => (order.orderNumber === orderNumber ? updated : order)));
    } catch {
      setError(t("errors.generic"));
    }
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

  const handleDownloadPdf = async (order: StoredOrder) => {
    setBusyPdf(order.orderNumber);
    try {
      const { dir: pdfDir, currency, labels } = pdfOpts();
      await downloadStoredOrderPdf(order, pdfDir, currency, labels, {
        dateLabel: dateLabel(order.createdAt),
        orderStatusLabel: t(`status.${order.status}`),
        paymentStatusLabel: t(`payment.${order.paymentStatus}`),
      });
    } catch {
      setError(t("errors.generic"));
    } finally {
      setBusyPdf("");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6" dir={dir}>
      {/* Header — Home button at the inline start, title centered, logout at
          the inline end (physically LEFT in the RTL/Persian layout). A 3-column
          grid keeps the title truly centered and prevents overlap on small
          screens (buttons shrink to icon-only under 420px). */}
      <div className="ks-admin-orders-header mb-4 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
        <Link
          to="/"
          aria-label={t("menu.home") || "خانه"}
          className="glass flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:scale-[1.03] active:scale-95"
          style={{ color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
        >
          <Home size={14} />
          {t("menu.home") || "خانه"}
        </Link>
        <h1 className="flex min-w-0 items-center justify-center gap-2 text-center text-base font-black sm:text-lg" style={{ color: "var(--text-primary)" }}>
          <ClipboardList size={19} className="shrink-0" style={{ color: "var(--accent-1)" }} />
          <span className="truncate">{t("admin.orders")}</span>
        </h1>
        <button type="button" onClick={logout} className="glass flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold" style={{ color: "var(--danger)" }}>
          <LogOut size={14} />
          {t("admin.logout")}
        </button>
      </div>

      {/* Compact management toolbar */}
      <div className="glass mb-4 flex flex-col gap-3 rounded-2xl p-3" style={{ border: "1px solid var(--border-soft)" }}>
        {/* Search */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.search")}
          className="w-full rounded-xl px-3.5 py-2 text-sm outline-none transition-colors focus:border-violet-500"
          style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
        />

        {/* Status filter pills */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === "all" ? "" : "opacity-70 hover:opacity-100"
            }`}
            style={{
              background: statusFilter === "all" ? "var(--chip-bg)" : "transparent",
              color: statusFilter === "all" ? "var(--accent-1)" : "var(--text-muted)",
              border: `1px solid ${statusFilter === "all" ? "var(--accent-1)" : "var(--border-soft)"}`,
            }}
          >
            {t("admin.filterAll")} · {summary.total}
          </button>
          {ORDER_STATUSES.map((status) => (
            <button
              type="button"
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                statusFilter === status ? "" : "opacity-70 hover:opacity-100"
              }`}
              style={{
                background: statusFilter === status ? "var(--chip-bg)" : "transparent",
                color: statusFilter === status ? "var(--accent-1)" : "var(--text-muted)",
                border: `1px solid ${statusFilter === status ? "var(--accent-1)" : "var(--border-soft)"}`,
              }}
            >
              {t(`status.${status}`)} · {summary.counts[status]}
            </button>
          ))}
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: "var(--chip-bg)" }}>
            <PackageCheck size={15} style={{ color: "var(--accent-1)" }} />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{t("admin.totalOrders")}</p>
              <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{summary.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: "var(--chip-bg)" }}>
            <Wallet size={15} style={{ color: "var(--accent-2)" }} />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{t("admin.revenueTotal")}</p>
              <p className="truncate text-sm font-black" style={{ color: "var(--text-primary)" }}>{summary.revenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: "var(--chip-bg)" }}>
            <Truck size={15} style={{ color: "#f59e0b" }} />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{t("hiboss.pending")}</p>
              <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{summary.pending}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: "var(--chip-bg)" }}>
            <PackageCheck size={15} style={{ color: "var(--success)" }} />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{t("hiboss.delivered")}</p>
              <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{summary.delivered}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mb-3 text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SearchX size={30} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {orders.length === 0 ? t("admin.noOrders") : t("search.noResults")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const open = openId === order.orderNumber;
            return (
              <div key={order.orderNumber} className="glass rounded-2xl p-4" style={{ border: "1px solid var(--border-soft)" }}>
                <button type="button" className="flex w-full items-center justify-between gap-3 text-start" onClick={() => setOpenId(open ? null : order.orderNumber)}>
                  <div className="min-w-0">
                    <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{order.orderNumber}</p>
                    <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{order.customer.name} · {order.customer.phone}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-block" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} {t("cart.itemsCount")}
                    </span>
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--chip-bg)", color: order.status === "delivered" ? "var(--success)" : "var(--accent-1)" }}>
                      {t(`status.${order.status}`)}
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="mt-4 flex flex-col gap-3 border-t pt-3" style={{ borderColor: "var(--border-soft)" }}>
                    <div className="grid gap-1 text-xs sm:grid-cols-2" style={{ color: "var(--text-secondary)" }}>
                      <span>{t("checkout.fullName")}: {order.customer.name}</span>
                      <span dir="ltr">{t("checkout.phone")}: {order.customer.phone}</span>
                      {order.customer.email ? <span dir="ltr">{t("checkout.email")}: {order.customer.email}</span> : null}
                      {order.customer.province ? <span>{t("checkout.province")}: {order.customer.province}</span> : null}
                      <span>{t("checkout.city")}: {order.customer.city}</span>
                      <span className="sm:col-span-2">{t("checkout.address")}: {order.customer.address}</span>
                      {order.customer.postalCode ? <span>{t("checkout.postalCode")}: {order.customer.postalCode}</span> : null}
                      <span>{t("checkout.date")}: {dateLabel(order.createdAt)}</span>
                      <span>{t("checkout.paymentStatus")}: {t(`payment.${order.paymentStatus}`)}</span>
                      {order.customer.notes ? <span className="sm:col-span-2">{t("checkout.notes")}: {order.customer.notes}</span> : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{t("admin.status")}:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatus(order.orderNumber, e.target.value as OrderStatus)}
                        className="rounded-xl px-3 py-1.5 text-xs outline-none cursor-pointer"
                        style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{t(`status.${status}`)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busyPdf === order.orderNumber}
                        onClick={() => handleDownloadPdf(order)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
                        style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
                      >
                        <FileDown size={14} />
                        {t("admin.downloadPdf")}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {order.items.map((item, index) => {
                        const unitPrice = item.unitPrice ?? item.price;
                        const colorLabel = item.variation || item.color;
                        return (
                          <div key={`${item.sku}-${index}`} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: "var(--chip-bg)" }}>
                            <div className="glass h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-soft)", background: "var(--surface)" }}>
                              <OrderItemImage item={item} />
                            </div>
                            <div className="min-w-0 flex-1 text-xs leading-5" style={{ color: "var(--text-primary)" }}>
                              <p className="truncate font-bold">{item.name || item.model}</p>
                              <p style={{ color: "var(--text-muted)" }}>
                                {t("product.productCode")}: <span dir="ltr" className="font-semibold">{item.productCode || "-"}</span>
                              </p>
                              {item.sku ? (
                                <p style={{ color: "var(--text-muted)" }}>
                                  {t("product.sku")}: <span dir="ltr" className="font-semibold">{item.sku}</span>
                                </p>
                              ) : null}
                              {colorLabel ? (
                                <p>
                                  {t("product.variation")}: {colorLabel}
                                </p>
                              ) : null}
                              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                                {t("cart.price")}: {unitPrice.toLocaleString()} {t("cart.toman")}
                                {" · "}
                                {t("cart.lineTotal")}: {item.lineTotal.toLocaleString()} {t("cart.toman")}
                              </p>
                            </div>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "var(--accent-1)" }}>
                              {item.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-end text-sm font-black" style={{ color: "var(--accent-1)" }}>
                      {t("checkout.grandTotal") || t("cart.total")}: {order.total.toLocaleString()} {t("cart.toman")}
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
