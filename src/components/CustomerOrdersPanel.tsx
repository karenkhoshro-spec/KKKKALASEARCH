import { useCallback, useEffect, useState } from "react";
import { ClipboardList, FileDown, RefreshCw, Phone } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { fetchCustomerOrders, type Order } from "../utils/api";
import { normalizeIranLocal, isValidIranLocal } from "../utils/phone";
import OrderStatusChip from "./OrderStatusChip";
import { generateOrderPdf, downloadBlob } from "../utils/pdf";

/**
 * «سفارشات شما» — shows the customer's REAL registered orders from the API
 * (GET /api/customer/orders?mobile=…). Orders are filtered strictly by mobile
 * number, so a customer only ever sees their own orders.
 */
export default function CustomerOrdersPanel({
  initialMobile = "",
  statuses,
}: {
  initialMobile?: string;
  statuses: string[];
}) {
  const { t, lang, dir } = useLanguage();
  const [mobile, setMobile] = useState(normalizeIranLocal(initialMobile));
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  void statuses;

  const valid = isValidIranLocal(mobile);

  const load = useCallback(
    async (m: string) => {
      if (!isValidIranLocal(m)) return;
      setLoading(true);
      setError(null);
      const res = await fetchCustomerOrders(m);
      if (res.ok) {
        setOrders(res.orders ?? []);
      } else {
        setError(res.error || "error");
        setOrders([]);
      }
      setLoading(false);
    },
    []
  );

  // auto-load once when a known account mobile exists
  useEffect(() => {
    if (isValidIranLocal(mobile)) void load(mobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const orderPdf = async (order: Order) => {
    setPdfBusy(order.id);
    try {
      const blob = await generateOrderPdf({
        orderNumber: order.orderNumber,
        date: fmtDate(order.createdAt),
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
          variation: [it.variationName].filter(Boolean).join(""),
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

  return (
    <section className="glass-strong mt-8 rounded-3xl p-5 sm:p-6" id="my-orders">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold" style={{ color: "var(--text-primary)" }}>
          <ClipboardList size={18} style={{ color: "var(--accent-1)" }} />
          {t("orders.yourOrders")}
        </h2>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void load(mobile);
          }}
        >
          <div className="glass flex items-center gap-1.5 rounded-xl px-2.5 py-1.5">
            <Phone size={14} style={{ color: "var(--accent-1)" }} />
            <input
              value={mobile}
              onChange={(e) => setMobile(normalizeIranLocal(e.target.value))}
              placeholder="9XX XXX XXXX"
              inputMode="numeric"
              dir="ltr"
              className="w-32 bg-transparent text-xs outline-none placeholder:opacity-50 sm:w-40 sm:text-sm"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <button
            type="submit"
            disabled={!valid || loading}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {t("orders.view")}
          </button>
        </form>
      </div>

      {error && (
        <p className="mt-3 text-xs" style={{ color: "var(--danger)" }}>
          {t("errors.generic")} ({error})
        </p>
      )}

      {orders !== null && orders.length === 0 && !loading && (
        <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("orders.empty")}
        </p>
      )}

      {orders && orders.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {orders.map((order) => (
            <div key={order.id} className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold" dir="ltr" style={{ color: "var(--text-primary)" }}>
                    {order.orderNumber}
                  </span>
                  <OrderStatusChip status={order.status} />
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {t("checkout.date")}: {fmtDate(order.createdAt)} ·{" "}
                  {order.items.reduce((s, i) => s + i.quantity, 0)} {t("cart.itemsCount")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold" style={{ color: "var(--accent-1)" }}>
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
          ))}
        </div>
      )}

      {orders === null && (
        <p className="mt-4 text-xs leading-6" style={{ color: "var(--text-muted)" }}>
          {t("orders.hint")}
        </p>
      )}
    </section>
  );
}
