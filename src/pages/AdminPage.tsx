import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, LogOut, RefreshCw, ShieldCheck, FileDown, User } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useToast } from "../context/ToastContext";
import BackButton from "../components/BackButton";
import OrderStatusChip from "../components/OrderStatusChip";
import {
  adminLogin,
  adminLogout,
  adminSession,
  adminFetchOrders,
  adminUpdateStatus,
  ORDER_STATUSES,
  type Order,
  type OrderStatus,
} from "../utils/api";
import { generateOrderPdf, downloadBlob } from "../utils/pdf";

export default function AdminPage() {
  const { t, lang, dir } = useLanguage();
  const { showToast } = useToast();

  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statusBusy, setStatusBusy] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("admin.title") + " | Kala Search";
  }, [t]);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    const res = await adminFetchOrders();
    if (res.ok) {
      setOrders(res.orders ?? []);
    } else {
      setAuthed(false);
    }
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    void (async () => {
      const ok = await adminSession();
      setAuthed(ok);
      setChecking(false);
      if (ok) await loadOrders();
    })();
  }, [loadOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(null);
    const res = await adminLogin(username.trim(), password);
    if (res.ok) {
      setAuthed(true);
      setPassword("");
      showToast(t("admin.loginOk"), "success");
      await loadOrders();
    } else {
      setLoginError(t("admin.loginFailed"));
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    setAuthed(false);
    setOrders([]);
  };

  const changeStatus = async (order: Order, status: OrderStatus) => {
    setStatusBusy(order.id);
    const res = await adminUpdateStatus(order.id, status);
    if (res.ok && res.order) {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? res.order! : o)));
      showToast(`${order.orderNumber} → ${t(`status.${status}`)}`, "success");
    } else {
      showToast(res.error || "error", "error");
      await loadOrders();
    }
    setStatusBusy(null);
  };

  const orderPdf = async (order: Order) => {
    setPdfBusy(order.id);
    try {
      const fmtDate = new Date(order.createdAt).toLocaleDateString(
        lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US"
      );
      const blob = await generateOrderPdf({
        orderNumber: order.orderNumber,
        date: fmtDate,
        customerName: order.customer.name,
        phone: order.customer.mobileFull || `+98${order.customer.mobile}`,
        address: [order.customer.province, order.customer.city, order.customer.address].filter(Boolean).join("، "),
        notes: order.customer.notes,
        status: t(`status.${order.status}`),
        items: order.items.map((it) => ({
          name: it.name,
          productCode: it.productCode,
          sku: it.sku,
          model: it.model,
          variation: it.variationName,
          color: it.color,
          quantity: it.quantity,
          price: it.unitPrice,
        })),
        total: order.total,
        currencyLabel: t("cart.toman"),
        dir,
        labels: {
          title: t("pdf.orderTitle"),
          orderNumber: t("checkout.orderNumber"),
          date: t("checkout.date"),
          customer: t("checkout.fullName"),
          phone: t("checkout.phone"),
          address: t("checkout.address"),
          notes: t("checkout.notes"),
          status: t("admin.status"),
          product: t("cart.product"),
          productCode: t("cart.productCode"),
          sku: "SKU",
          model: t("cart.model"),
          color: t("cart.color"),
          variation: t("product.variation"),
          quantity: t("cart.quantity"),
          price: t("cart.price"),
          lineTotal: t("cart.lineTotal"),
          total: t("cart.total"),
        },
      });
      downloadBlob(blob, `${order.orderNumber}.pdf`);
    } finally {
      setPdfBusy(null);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US");

  const inputStyle = {
    background: "var(--input-bg)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-soft)",
  };

  /* ------------------------------- LOGIN CARD ------------------------------- */
  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <RefreshCw className="animate-spin" size={22} style={{ color: "var(--accent-1)" }} />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <BackButton to="/" />
          <span />
        </div>

        <form
          onSubmit={handleLogin}
          className="glass-strong animate-pop flex flex-col gap-4 rounded-[28px] p-6 shadow-[var(--shadow-glow)] sm:p-8"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--chip-bg)" }}>
            <ShieldCheck size={26} style={{ color: "var(--accent-1)" }} />
          </div>
          <h1 className="text-center text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {t("admin.loginTitle")}
          </h1>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("admin.username")}
            </label>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2" style={{ color: "var(--accent-1)" }} />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-2xl px-3.5 py-3 text-sm outline-none ps-10"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("admin.password")}
            </label>
            <div className="relative">
              {/* password is masked; eye toggle sits INSIDE the input on the LEFT side */}
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded-2xl px-3.5 py-3 text-sm outline-none pe-3"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t("admin.hidePassword") : t("admin.showPassword")}
                title={showPassword ? t("admin.hidePassword") : t("admin.showPassword")}
                className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: "var(--accent-1)" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {loginError && (
            <p className="text-center text-xs font-semibold" style={{ color: "var(--danger)" }}>
              {loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={loggingIn || !username || !password}
            className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            <Lock size={15} />
            {loggingIn ? t("common.loading") : t("admin.login")}
          </button>
        </form>
      </div>
    );
  }

  /* ------------------------------ ORDERS PANEL ------------------------------ */
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/" />
        <h1 className="flex items-center gap-2 text-base font-bold sm:text-lg" style={{ color: "var(--text-primary)" }}>
          <ShieldCheck size={19} style={{ color: "var(--accent-1)" }} />
          {t("admin.orders")}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadOrders()}
            className="glass flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-105 active:scale-95"
            aria-label={t("admin.refresh")}
            title={t("admin.refresh")}
          >
            <RefreshCw size={15} className={loadingOrders ? "animate-spin" : ""} style={{ color: "var(--accent-1)" }} />
          </button>
          <button
            onClick={() => void handleLogout()}
            className="glass flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-transform hover:scale-105 active:scale-95"
            style={{ color: "var(--danger)" }}
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">{t("admin.logout")}</span>
          </button>
        </div>
      </div>

      {orders.length === 0 && !loadingOrders && (
        <div className="glass rounded-3xl p-12 text-center">
          <p style={{ color: "var(--text-muted)" }}>{t("admin.empty")}</p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {orders.map((order) => (
          <div key={order.id} className="glass-strong animate-fade-up rounded-3xl p-5">
            {/* order header: number, date, total, status, PDF */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border-soft)" }}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-base font-extrabold" dir="ltr" style={{ color: "var(--text-primary)" }}>
                  {order.orderNumber}
                </span>
                <OrderStatusChip status={order.status} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {fmtDate(order.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold" style={{ color: "var(--accent-1)" }}>
                  {order.total.toLocaleString()} {t("cart.toman")}
                </span>
                <button
                  onClick={() => void orderPdf(order)}
                  disabled={pdfBusy === order.id}
                  className="glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                  style={{ color: "var(--text-primary)" }}
                >
                  <FileDown size={14} style={{ color: "var(--accent-1)" }} />
                  {pdfBusy === order.id ? t("common.loading") : "PDF"}
                </button>
              </div>
            </div>

            {/* customer block */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="glass rounded-2xl p-4">
                <h3 className="mb-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                  {t("admin.customer")}
                </h3>
                <div className="flex flex-col gap-1.5 text-sm" style={{ color: "var(--text-primary)" }}>
                  <p className="font-bold">{order.customer.name}</p>
                  <p dir="ltr" className="text-start" style={{ color: "var(--text-secondary)" }}>
                    {order.customer.mobileFull || `+98${order.customer.mobile}`}
                  </p>
                  {(order.customer.address || order.customer.city || order.customer.province) && (
                    <p className="text-xs leading-6" style={{ color: "var(--text-secondary)" }}>
                      {[order.customer.province, order.customer.city, order.customer.address].filter(Boolean).join("، ")}
                    </p>
                  )}
                  {order.customer.postal && (
                    <p className="text-xs" dir="ltr" style={{ color: "var(--text-muted)" }}>
                      {t("checkout.postal")}: {order.customer.postal}
                    </p>
                  )}
                  {order.customer.notes && (
                    <p className="text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                      {t("checkout.notes")}: {order.customer.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* status control */}
              <div className="glass rounded-2xl p-4">
                <h3 className="mb-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                  {t("admin.changeStatus")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => order.status !== s && void changeStatus(order, s)}
                      disabled={statusBusy === order.id}
                      className="rounded-xl border px-3 py-2 text-xs font-bold transition-all disabled:opacity-50"
                      style={{
                        borderColor: order.status === s ? "var(--accent-1)" : "var(--border-soft)",
                        background: order.status === s ? "var(--chip-bg)" : "transparent",
                        color: order.status === s ? "var(--accent-1)" : "var(--text-secondary)",
                      }}
                    >
                      {t(`status.${s}`)}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {t("orders.payment")}: {t("orders.paymentUnpaid")}
                </p>
              </div>
            </div>

            {/* items table — everything the seller needs */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs sm:text-sm">
                <thead>
                  <tr style={{ color: "var(--text-muted)" }}>
                    <th className="p-2 text-start font-semibold">{t("admin.itemImage")}</th>
                    <th className="p-2 text-start font-semibold">{t("cart.product")}</th>
                    <th className="p-2 text-start font-semibold">{t("cart.productCode")}</th>
                    <th className="p-2 text-start font-semibold">SKU</th>
                    <th className="p-2 text-start font-semibold">{t("cart.model")}</th>
                    <th className="p-2 text-start font-semibold">{t("product.variation")}</th>
                    <th className="p-2 text-center font-semibold">{t("cart.quantity")}</th>
                    <th className="p-2 text-center font-semibold">{t("cart.unitPrice")}</th>
                    <th className="p-2 text-center font-semibold">{t("cart.lineTotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, idx) => (
                    <tr key={`${it.productId}-${it.variationId ?? "base"}-${idx}`} className="border-t" style={{ borderColor: "var(--border-soft)" }}>
                      <td className="p-2">
                        {it.image ? (
                          <img src={it.image} alt={it.name} className="h-12 w-12 rounded-lg object-contain" />
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td className="p-2 font-semibold" style={{ color: "var(--text-primary)" }}>{it.name}</td>
                      <td className="p-2" dir="ltr" style={{ color: "var(--text-secondary)" }}>{it.productCode ?? "—"}</td>
                      <td className="p-2" dir="ltr" style={{ color: "var(--text-secondary)" }}>{it.sku ?? "—"}</td>
                      <td className="p-2" dir="ltr" style={{ color: "var(--text-secondary)" }}>{it.model ?? "—"}</td>
                      <td className="p-2">
                        <span className="inline-flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                          {it.color && (
                            <span className="h-3 w-3 rounded-full" style={{ background: it.color, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35)" }} />
                          )}
                          {it.variationName ?? "—"}
                        </span>
                      </td>
                      <td className="p-2 text-center font-bold" style={{ color: "var(--text-primary)" }}>{it.quantity}</td>
                      <td className="p-2 text-center" style={{ color: "var(--text-secondary)" }}>{it.unitPrice.toLocaleString()}</td>
                      <td className="p-2 text-center font-bold" style={{ color: "var(--accent-1)" }}>{it.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
