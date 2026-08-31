import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { FileDown, PackageCheck } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { generateOrderPdf, downloadBlob } from "../utils/pdf";
import { placeOrder, type Order } from "../utils/api";
import { normalizeIranLocal, isValidIranLocal } from "../utils/phone";
import BackButton from "../components/BackButton";
import OrderStatusChip from "../components/OrderStatusChip";

export default function CheckoutPage() {
  const { t, lang, dir } = useLanguage();
  const { items, total, clearCart } = useCart();
  const { account, addOrder } = useAccount();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(account?.name ?? "");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ order: Order; pdfBlob: Blob } | null>(null);

  if (items.length === 0 && !result) {
    return <Navigate to="/cart" replace />;
  }

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!fullName.trim()) nextErrors.name = t("checkout.required");
    if (!isValidIranLocal(normalizeIranLocal(phoneLocal))) nextErrors.phone = t("checkout.invalidPhone");
    if (!address.trim()) nextErrors.address = t("checkout.required");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPdf = async (order: Order) => {
    const fmtDate = new Date(order.createdAt).toLocaleDateString(
      lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US"
    );
    return generateOrderPdf({
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      // 1) register the REAL order on the server (it assigns the order number)
      const res = await placeOrder({
        customer: {
          name: fullName.trim(),
          mobile: normalizeIranLocal(phoneLocal),
          address: address.trim(),
          province: province.trim() || undefined,
          city: city.trim() || undefined,
          postal: postal.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          productCode: it.productCode,
          sku: it.sku,
          model: it.model,
          image: it.image,
          variationId: it.variation?.id,
          variationName: it.variation?.name,
          color: it.variation?.color,
          quantity: it.quantity,
          unitPrice: it.price,
        })),
        lang,
      });

      if (!res.ok || !res.order) {
        showToast(t("checkout.registerFailed") + (res.error ? ` (${res.error})` : ""), "error");
        setSubmitting(false);
        return;
      }

      const order = res.order;

      // 2) generate the REAL PDF for exactly THIS order
      const pdfBlob = await buildPdf(order);

      addOrder({
        orderNumber: order.orderNumber,
        date: new Date(order.createdAt).toLocaleDateString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US"),
        total: order.total,
        itemsCount: order.items.reduce((s, i) => s + i.quantity, 0),
      });
      downloadBlob(pdfBlob, `${order.orderNumber}.pdf`);
      showToast(t("notifications.orderConfirmed"), "success");

      setResult({ order, pdfBlob });
      clearCart();
    } catch {
      showToast(t("errors.generic"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const order = result.order;
    const fmtDate = new Date(order.createdAt).toLocaleString(
      lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US"
    );
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="glass-strong animate-pop mx-auto flex flex-col items-center gap-4 rounded-3xl p-8">
          <PackageCheck size={44} style={{ color: "var(--success)" }} />
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t("checkout.successTitle")}
          </h1>
          <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            {t("checkout.successDesc")}
          </p>
          <div className="glass w-full rounded-2xl p-4 text-sm" style={{ color: "var(--text-primary)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("checkout.orderNumber")}</span>
              <span className="font-bold" dir="ltr">{order.orderNumber}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("checkout.date")}</span>
              <span className="font-bold">{fmtDate}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("admin.status")}</span>
              <OrderStatusChip status={order.status} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("orders.payment")}</span>
              <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                {t("orders.paymentUnpaid")}
              </span>
            </div>
          </div>

          <button
            onClick={() => downloadBlob(result.pdfBlob, `${order.orderNumber}.pdf`)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-95"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            <FileDown size={16} />
            {t("checkout.downloadPdf")}
          </button>

          <Link to="/cart" className="text-sm font-semibold" style={{ color: "var(--accent-1)" }}>
            {t("orders.yourOrders")} ← {t("cart.title")}
          </Link>
          <Link to="/" className="text-sm font-semibold" style={{ color: "var(--accent-1)" }}>
            {t("errors.goHome")}
          </Link>
        </div>
      </div>
    );
  }

  const inputStyle = {
    background: "var(--input-bg)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-soft)",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Back to cart: RIGHT side, inside its own glass box · title centered, slightly smaller */}
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/cart" label={t("checkout.backToCart")} />
        <h1 className="px-2 text-center text-base font-bold sm:text-lg" style={{ color: "var(--text-primary)" }}>
          {t("checkout.title")}
        </h1>
        <span className="w-[1px]" />
      </div>

      <form onSubmit={handleSubmit} className="glass flex flex-col gap-4 rounded-3xl p-5 sm:p-7">
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {t("checkout.customerInfo")}
        </h2>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.fullName")}
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
          {errors.name && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.phone")}
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
              +98
            </span>
            <input
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(normalizeIranLocal(e.target.value))}
              placeholder="9XX XXX XXXX"
              inputMode="numeric"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
            />
          </div>
          {errors.phone && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.phone}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("checkout.province")}
            </label>
            <input value={province} onChange={(e) => setProvince(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("checkout.city")}
            </label>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("checkout.postal")}
            </label>
            <input
              value={postal}
              onChange={(e) => setPostal(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.address")}
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("checkout.addressPlaceholder")}
            rows={2}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
          {errors.address && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.address}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.notes")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("checkout.notesPlaceholder")}
            rows={3}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </div>

        <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("cart.total")}
          </span>
          <span className="text-lg font-extrabold" style={{ color: "var(--accent-1)" }}>
            {total.toLocaleString()} {t("cart.toman")}
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
          style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
        >
          {submitting ? t("common.loading") : t("checkout.submit")}
        </button>
      </form>
    </div>
  );
}
