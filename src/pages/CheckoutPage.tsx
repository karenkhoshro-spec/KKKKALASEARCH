import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FileDown, PackageCheck, Send } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { generateOrderPdf, downloadBlob } from "../utils/pdf";
import { deliverOrderToSeller } from "../utils/sellerDelivery";
import { normalizeIranLocal, isValidIranLocal, toFullIranPhone } from "../utils/phone";
import { meaningfulSpec } from "../utils/specFilter";
import BackButton from "../components/BackButton";

function generateOrderNumber() {
  const now = new Date();
  return `KS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface CheckoutErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  email?: string;
}

export default function CheckoutPage() {
  const { t, lang, dir } = useLanguage();
  const { items, total, clearCart } = useCart();
  const { account, addOrder } = useAccount();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(account?.firstName ?? account?.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(account?.lastName ?? (account?.name?.split(" ").slice(1).join(" ") ?? ""));
  const [phoneLocal, setPhoneLocal] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<CheckoutErrors>({});
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
    const nextErrors: CheckoutErrors = {};
    if (!firstName.trim()) nextErrors.firstName = t("checkout.required");
    if (!lastName.trim()) nextErrors.lastName = t("checkout.required");
    if (!isValidIranLocal(normalizeIranLocal(phoneLocal))) nextErrors.phone = t("checkout.invalidPhone");
    // Address is mandatory: an order can never be confirmed without it.
    if (!address.trim()) nextErrors.address = t("checkout.addressRequired");
    // Email is optional — but if provided, it must look like an email.
    if (email.trim() && !EMAIL_RE.test(email.trim())) nextErrors.email = t("checkout.invalidEmail");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setSubmitting(true);

    const orderNumber = generateOrderNumber();
    const now = new Date();
    const date = now.toLocaleDateString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US");
    const time = now.toLocaleTimeString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" });
    const fullPhone = toFullIranPhone(phoneLocal);
    const trimmedEmail = email.trim();

    try {
      const pdfBlob = await generateOrderPdf({
        orderNumber,
        date,
        time,
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: fullPhone,
          email: trimmedEmail || undefined,
          address: address.trim(),
          notes: notes.trim() || undefined,
        },
        items: items.map((it) => ({
          name: it.name,
          variation: it.variation?.name,
          colorName: it.colorName,
          sku: it.variation?.sku,
          quantity: it.quantity,
          packQuantity: it.packQuantity,
          price: it.price,
          technicalSpec: meaningfulSpec(it.technicalSpec) || undefined,
          url: it.url,
        })),
        total,
        currencyLabel: t("cart.toman"),
        dir,
        labels: {
          title: t("checkout.title"),
          orderNumber: t("checkout.orderNumber"),
          date: t("checkout.date"),
          time: t("checkout.time"),
          customer: t("checkout.customerInfo"),
          firstName: t("checkout.firstName"),
          lastName: t("checkout.lastName"),
          phone: t("checkout.phone"),
          email: t("checkout.email"),
          address: t("checkout.address"),
          notes: t("checkout.orderNotes"),
          product: t("cart.product"),
          variation: t("product.variation"),
          color: t("product.color"),
          sku: t("product.sku"),
          quantity: t("cart.quantity"),
          packQuantity: t("product.packQuantity"),
          price: t("product.price"),
          spec: t("product.specTitle"),
          lineTotal: t("cart.total"),
          total: t("cart.total"),
          priceUnknown: t("checkout.inquirePrice"),
          footerNote: t("checkout.pdfFooterNote"),
        },
      });

      const delivery = await deliverOrderToSeller(pdfBlob, {
        orderNumber,
        date,
        customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: fullPhone,
        email: trimmedEmail || undefined,
        address: address.trim(),
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

          {!result.sent && (
            <div
              className="flex w-full items-start gap-2 rounded-2xl p-3.5 text-start text-xs leading-5"
              style={{ background: "var(--chip-bg)", color: "var(--text-secondary)" }}
            >
              <Send size={15} className="mt-0.5 shrink-0" />
              <span>{t("checkout.deliveryPreparing")}</span>
            </div>
          )}

          <Link to="/" className="text-sm font-semibold" style={{ color: "var(--accent-1)" }}>
            {t("errors.goHome")}
          </Link>
        </div>
      </div>
    );
  }

  const errorText = (key: keyof CheckoutErrors) =>
    errors[key] ? <p className="mt-1 text-xs font-bold" style={{ color: "var(--danger)" }}>{errors[key]}</p> : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-2" style={{ direction: "ltr" }}>
        <BackButton to="/cart" label={t("checkout.backToCart")} />
        <h1 className="text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
          {t("checkout.title")}
        </h1>
        <span />
      </div>

      <form onSubmit={handleSubmit} noValidate className="glass flex flex-col gap-4 rounded-3xl p-5 sm:p-7">
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {t("checkout.customerInfo")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="checkout-first-name" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("checkout.firstName")}
            </label>
            <input
              id="checkout-first-name"
              dir="auto"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="ks-field ks-field-bordered w-full rounded-xl px-3.5 py-2.5 text-base outline-none"
            />
            {errorText("firstName")}
          </div>
          <div>
            <label htmlFor="checkout-last-name" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("checkout.lastName")}
            </label>
            <input
              id="checkout-last-name"
              dir="auto"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="ks-field ks-field-bordered w-full rounded-xl px-3.5 py-2.5 text-base outline-none"
            />
            {errorText("lastName")}
          </div>
        </div>

        <div>
          <label htmlFor="checkout-phone" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.phone")}
          </label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
              +98
            </span>
            <input
              id="checkout-phone"
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(normalizeIranLocal(e.target.value))}
              placeholder="9XX XXX XXXX"
              inputMode="numeric"
              className="ks-field ks-field-bordered w-full rounded-xl px-3.5 py-2.5 text-base outline-none"
            />
          </div>
          {errorText("phone")}
        </div>

        <div>
          <label htmlFor="checkout-email" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.email")}
          </label>
          <input
            id="checkout-email"
            dir="ltr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="ks-field ks-field-bordered w-full rounded-xl px-3.5 py-2.5 text-base outline-none"
            style={{ textAlign: dir === "rtl" ? "start" : undefined }}
          />
          {errorText("email")}
        </div>

        <div>
          <label htmlFor="checkout-address" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.address")} <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <textarea
            id="checkout-address"
            dir="auto"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("checkout.addressPlaceholder")}
            rows={3}
            className="ks-field ks-field-bordered w-full rounded-xl px-3.5 py-2.5 text-base outline-none"
          />
          {errorText("address")}
        </div>

        <div>
          <label htmlFor="checkout-notes" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.orderNotes")} <span className="font-normal" style={{ color: "var(--text-muted)" }}>({t("checkout.optional")})</span>
          </label>
          <textarea
            id="checkout-notes"
            dir="auto"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("checkout.notesPlaceholder")}
            rows={2}
            className="ks-field ks-field-bordered w-full rounded-xl px-3.5 py-2.5 text-base outline-none"
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
