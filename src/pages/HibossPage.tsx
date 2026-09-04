import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Lock, LogOut, ShieldAlert, FileDown, BarChart3, PackageCheck, Wallet, Truck } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { fetchAdminOrders, patchOrderStatus, ORDER_STATUSES, type StoredOrder, type OrderStatus } from "../utils/ordersApi";
import { downloadStoredOrderPdf, orderPdfLabels } from "../utils/orderPdf";
import OrderItemImage from "../components/OrderItemImage";

const HIBOSS_ACCENT = { color: "#e9d5ff", textShadow: "0 0 14px rgba(192,132,252,.8), 0 0 30px rgba(124,58,237,.45)" };

export default function HibossPage() {
  const { t, dir, lang } = useLanguage();
  const { token, role, ready, ownerLogin, logout } = useAdminAuth();

  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyPdf, setBusyPdf] = useState("");
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const isOwner = token !== null && role === "owner";

  useEffect(() => {
    if (!isOwner || !token) return;
    fetchAdminOrders(token)
      .then(setOrders)
      .catch(() => setError(t("errors.generic")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, token]);

  const stats = useMemo(() => {
    const total = orders.length;
    const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const itemsSold = orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);
    const pending = orders.filter((order) => ["preparing", "ready_pickup", "shipping"].includes(order.status)).length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const counts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, orders.filter((order) => order.status === status).length])) as Record<OrderStatus, number>;
    return { total, revenue, itemsSold, pending, delivered, counts };
  }, [orders]);

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLoginError("");
    try {
      await ownerLogin(username.trim(), password);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "owner_not_configured") setLoginError(t("hiboss.notConfigured"));
      else if (code === "invalid_credentials") setLoginError(t("admin.invalidCredentials"));
      else setLoginError(t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

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

  const handlePdf = async (order: StoredOrder) => {
    setBusyPdf(order.orderNumber);
    try {
      await downloadStoredOrderPdf(order, dir, t("cart.toman"), orderPdfLabels(t), {
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

  if (!ready) {
    return <p className="py-20 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("common.loading")}</p>;
  }

  // ---------- Login gate (owner credentials only) ----------
  if (!isOwner) {
    const denied = token !== null && role !== null && role !== "owner";
    return (
      <div className="mx-auto max-w-md px-4 py-10" dir={dir}>
        <div
          className="rounded-[28px] border p-6 sm:p-8"
          style={{
            background: "linear-gradient(170deg, rgba(26,13,52,.9), rgba(8,5,16,.96))",
            borderColor: "rgba(192,132,252,.4)",
            boxShadow: "0 0 0 1px rgba(192,132,252,.16), 0 0 34px rgba(124,58,237,.2), inset 0 1px 0 rgba(255,255,255,.08)",
          }}
        >
          <div className="mb-5 flex flex-col items-center gap-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(124,58,237,.2)", boxShadow: "0 0 22px rgba(168,85,247,.5)" }}>
              {denied ? <ShieldAlert size={26} style={{ color: "#fda4af" }} /> : <Crown size={26} style={{ color: "#e9d5ff", filter: "drop-shadow(0 0 8px rgba(192,132,252,.8))" }} />}
            </span>
            <h1 className="text-lg font-black" style={denied ? { color: "#fecdd3", textShadow: "0 0 12px rgba(244,63,94,.5)" } : HIBOSS_ACCENT}>
              {denied ? t("hiboss.denied") : t("hiboss.title")}
            </h1>
            <p className="text-xs leading-6" style={{ color: "var(--text-muted)" }}>
              {denied ? t("hiboss.deniedDesc") : t("hiboss.loginSub")}
            </p>
          </div>

          {denied ? (
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white"
              style={{ background: "linear-gradient(90deg,#e11d48,#be123c)", boxShadow: "0 0 20px rgba(225,29,72,.35)" }}
            >
              <LogOut size={16} />
              {t("admin.logout")}
            </button>
          ) : (
            <form onSubmit={handleOwnerLogin} className="flex flex-col gap-3">
              {loginError && (
                <p className="rounded-xl px-3 py-2 text-[11px] font-semibold leading-5" style={{ background: "rgba(244,63,94,.14)", color: "#fda4af", border: "1px solid rgba(244,63,94,.35)" }}>
                  {loginError}
                </p>
              )}
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{t("hiboss.username")}</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,.06)", color: "var(--text-primary)", border: "1px solid rgba(192,132,252,.35)" }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{t("hiboss.password")}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "rgba(255,255,255,.06)", color: "var(--text-primary)", border: "1px solid rgba(192,132,252,.35)" }}
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                style={{ background: "linear-gradient(90deg,#7c3aed,#a855f7)", boxShadow: "0 0 24px rgba(168,85,247,.5)" }}
              >
                <Lock size={15} />
                {submitting ? t("common.loading") : t("hiboss.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ---------- Owner dashboard ----------
  return (
    <div className="mx-auto max-w-5xl px-3 py-5 sm:px-6" dir={dir}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "rgba(124,58,237,.2)", boxShadow: "0 0 20px rgba(168,85,247,.45)" }}>
            <Crown size={22} style={{ color: "#e9d5ff", filter: "drop-shadow(0 0 8px rgba(192,132,252,.9))" }} />
          </span>
          <div>
            <h1 className="text-lg font-black leading-6 sm:text-xl" style={HIBOSS_ACCENT}>{t("hiboss.title")}</h1>
            <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{t("hiboss.ownerOnly")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/orders"
            className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{ color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
          >
            <PackageCheck size={13} />
            {t("hiboss.fullManagement")}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold"
            style={{ color: "#fda4af", background: "rgba(244,63,94,.14)", border: "1px solid rgba(244,63,94,.4)" }}
          >
            <LogOut size={13} />
            {t("hiboss.logout")}
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-xs" style={{ color: "var(--danger)" }}>{error}</p>}

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: <BarChart3 size={17} />, label: t("hiboss.totalOrders"), value: String(stats.total), glow: "rgba(168,85,247,.5)" },
          { icon: <Wallet size={17} />, label: t("hiboss.revenue"), value: stats.revenue.toLocaleString(), glow: "rgba(249,115,22,.5)" },
          { icon: <Truck size={17} />, label: t("hiboss.pending"), value: String(stats.pending), glow: "rgba(250,204,21,.45)" },
          { icon: <PackageCheck size={17} />, label: t("hiboss.delivered"), value: String(stats.delivered), glow: "rgba(34,197,94,.5)" },
        ].map((cell) => (
          <div
            key={cell.label}
            className="rounded-2xl border p-3"
            style={{ background: "linear-gradient(160deg, rgba(255,255,255,.07), rgba(255,255,255,.02))", borderColor: "rgba(192,132,252,.28)" }}
          >
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: cell.glow, filter: `drop-shadow(0 0 5px ${cell.glow})` }}>{cell.icon}</span>
              {cell.label}
            </div>
            <p className="truncate text-lg font-black" style={{ color: "#f5f3ff", textShadow: `0 0 14px ${cell.glow}` }}>
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      {/* Status distribution */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {ORDER_STATUSES.map((status) => (
          <span key={status} className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: "rgba(124,58,237,.16)", color: "#e9d5ff", border: "1px solid rgba(168,85,247,.35)" }}>
            {t(`status.${status}`)} · {stats.counts[status]}
          </span>
        ))}
        <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: "rgba(34,197,94,.14)", color: "#bbf7d0", border: "1px solid rgba(34,197,94,.4)" }}>
          {t("hiboss.itemsSold")}: {stats.itemsSold}
        </span>
      </div>

      {/* Recent orders */}
      <h2 className="mb-3 flex items-center gap-2 text-sm font-black" style={{ color: "var(--text-primary)" }}>
        <BarChart3 size={15} style={{ color: "var(--accent-1)" }} />
        {t("hiboss.recentTitle")}
      </h2>

      {orders.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>{t("admin.noOrders")}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {orders.slice(0, 12).map((order) => {
            const open = openId === order.orderNumber;
            return (
              <div key={order.orderNumber} className="rounded-2xl border p-3.5" style={{ background: "rgba(255,255,255,.045)", borderColor: "rgba(192,132,252,.24)" }}>
                <button type="button" className="flex w-full items-center justify-between gap-3 text-start" onClick={() => setOpenId(open ? null : order.orderNumber)}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black" style={{ color: "var(--text-primary)" }}>{order.orderNumber}</p>
                    <p className="truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {order.customer.name} · {order.customer.phone} · {dateLabel(order.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: order.status === "delivered" ? "rgba(34,197,94,.16)" : "rgba(124,58,237,.2)", color: order.status === "delivered" ? "#bbf7d0" : "#e9d5ff" }}>
                    {t(`status.${order.status}`)}
                  </span>
                </button>

                {open && (
                  <div className="mt-3 flex flex-col gap-2.5 border-t pt-3" style={{ borderColor: "rgba(192,132,252,.18)" }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>{t("hiboss.orderStatus")}:</span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatus(order.orderNumber, e.target.value as OrderStatus)}
                        className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs outline-none"
                        style={{ background: "rgba(255,255,255,.07)", color: "var(--text-primary)", border: "1px solid rgba(192,132,252,.35)" }}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>{t(`status.${status}`)}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busyPdf === order.orderNumber}
                        onClick={() => handlePdf(order)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        style={{ background: "linear-gradient(90deg,#7c3aed,#a855f7)" }}
                      >
                        <FileDown size={13} />
                        {t("admin.downloadPdf")}
                      </button>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {order.items.map((item, index) => {
                        const unitPrice = item.unitPrice ?? item.price;
                        return (
                          <div key={`${item.sku}-${index}`} className="flex items-center gap-2.5 rounded-xl p-2" style={{ background: "rgba(0,0,0,.28)" }}>
                            <div className="glass h-12 w-12 shrink-0 overflow-hidden rounded-lg" style={{ border: "1px solid var(--border-soft)" }}>
                              <OrderItemImage item={item} />
                            </div>
                            <div className="min-w-0 flex-1 text-[11px] leading-4" style={{ color: "var(--text-primary)" }}>
                              <p className="truncate font-bold">{item.name || item.model}</p>
                              <p style={{ color: "var(--text-muted)" }}>
                                {t("product.productCode")}: <span dir="ltr">{item.productCode || "-"}</span>
                                {item.variation || item.color ? ` · ${item.variation || item.color}` : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold" style={{ color: "var(--text-secondary)" }}>
                              <span>×{item.quantity}</span>
                              <span className="text-violet-300">{(unitPrice * item.quantity).toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-end text-sm font-black" style={{ color: "#f0abfc", textShadow: "0 0 10px rgba(192,132,252,.6)" }}>
                      {t("checkout.grandTotal")}: {order.total.toLocaleString()} {t("cart.toman")}
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
