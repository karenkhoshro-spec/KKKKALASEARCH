import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FileDown, PackageCheck, AlertCircle, Send } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { generateOrderPdf, downloadBlob } from "../utils/pdf";
import { deliverOrderToSeller } from "../utils/sellerDelivery";
import { normalizeIranLocal, isValidIranLocal, toFullIranPhone } from "../utils/phone";
import BackButton from "../components/BackButton";

function generateOrderNumber() {
  const now = new Date();
  return `KS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function CheckoutPage() {
  const { t, lang, dir } = useLanguage();
  const { items, total, clearCart } = useCart();
  const { account, addOrder } = useAccount();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(account?.name ?? "");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    orderNumber: string;
    date: string;
    pdfBlob: Blob;
    sent: boolean;
  } | null>(null);

  if (items.length === 0 && !result) {
    return <Navigate to="/cart" replace />;
  }

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!fullName.trim()) nextErrors.name = t("checkout.required");
    if (!isValidIranLocal(normalizeIranLocal(phoneLocal))) nextErrors.phone = t("checkout.invalidPhone");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const orderNumber = generateOrderNumber();
    const date = new Date().toLocaleDateString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US");
    const fullPhone = toFullIranPhone(phoneLocal);

    try {
      const pdfBlob = await generateOrderPdf({
        orderNumber,
        date,
        customerName: fullName.trim(),
        phone: fullPhone,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          name: it.name,
          variation: it.variation?.name,
          quantity: it.quantity,
          price: it.price,
        })),
        total,
        currencyLabel: t("cart.toman"),
        dir,
        labels: {
          title: t("checkout.title"),
          orderNumber: t("checkout.orderNumber"),
          date: t("checkout.date"),
          customer: t("checkout.fullName"),
          phone: t("checkout.phone"),
          notes: t("checkout.notes"),
          product: t("cart.product"),
          variation: t("product.variation"),
          quantity: t("cart.quantity"),
          price: t("cart.price"),
          lineTotal: t("cart.total"),
          total: t("cart.total"),
        },
      });

      const delivery = await deliverOrderToSeller(pdfBlob, {
        orderNumber,
        date,
        customerName: fullName.trim(),
        phone: fullPhone,
        notes: notes.trim(),
        items,
        total,
      });

      addOrder({ orderNumber, date, total, itemsCount: items.reduce((s, i) => s + i.quantity, 0) });
      downloadBlob(pdfBlob, `${orderNumber}.pdf`);
      showToast(t("notifications.pdfGenerated"), "success");

      setResult({ orderNumber, date, pdfBlob, sent: delivery.sent });
      clearCart();
    } catch {
      showToast(t("errors.generic"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
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
            <div className="flex justify-between py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("checkout.orderNumber")}</span>
              <span className="font-bold">{result.orderNumber}</span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("checkout.date")}</span>
              <span className="font-bold">{result.date}</span>
            </div>
          </div>

          <button
            onClick={() => downloadBlob(result.pdfBlob, `${result.orderNumber}.pdf`)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-95"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            <FileDown size={16} />
            {t("checkout.downloadPdf")}
          </button>

          <div
            className="flex w-full items-start gap-2 rounded-2xl p-3.5 text-start text-xs leading-5"
            style={{ background: "var(--chip-bg)", color: "var(--text-secondary)" }}
          >
            {result.sent ? <Send size={15} className="mt-0.5 shrink-0" /> : <AlertCircle size={15} className="mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />}
            <span>{result.sent ? t("notifications.orderConfirmed") : t("checkout.sendNotConfigured")}</span>
          </div>

          <Link to="/" className="text-sm font-semibold" style={{ color: "var(--accent-1)" }}>
            {t("errors.goHome")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/cart" label={t("checkout.backToCart")} />
        <h1 className="text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
          {t("checkout.title")}
        </h1>
        <span />
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
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
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
              style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
            />
          </div>
          {errors.phone && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.phone}</p>}
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
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
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
        <button type="button" onClick={() => navigate("/cart")} className="text-xs font-semibold underline" style={{ color: "var(--text-muted)" }}>
          {t("checkout.backToCart")}
        </button>
      </form>
    </div>
  );
}
