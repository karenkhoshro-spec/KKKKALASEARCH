import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FileDown, PackageCheck, Send } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { generateOrderPdf, downloadBlob } from "../utils/pdf";
import { orderPdfLabels, storedOrderToPdfData } from "../utils/orderPdf";
import { deliverOrderToSeller } from "../utils/sellerDelivery";
import { normalizeIranLocal, isValidIranLocal, toFullIranPhone } from "../utils/phone";
import { goBack } from "../utils/safeBack";
import { buildOrderItems, createRemoteOrder, type PaymentStatus } from "../utils/ordersApi";
import OverlayHeader from "../components/OverlayHeader";

export default function CheckoutPage() {
  const { t, lang, dir } = useLanguage();
  const { items, total, clearCart } = useCart();
  const { account, addOrder } = useAccount();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(account?.name ?? "");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; address?: string; province?: string; city?: string; postalCode?: string; email?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    orderNumber: string;
    date: string;
    pdfBlob: Blob;
    sent: boolean;
    paymentStatus: PaymentStatus;
    status: string;
  } | null>(null);

  if (items.length === 0 && !result) {
    return <Navigate to="/cart" replace />;
  }

  const validate = () => {
    const nextErrors: typeof errors = {};
    if (!fullName.trim()) {
      nextErrors.name = t("checkout.required") || "این فیلد الزامی است";
      showToast("لطفاً نام و نام خانوادگی را وارد کنید.", "error");
    }
    if (!isValidIranLocal(normalizeIranLocal(phoneLocal))) {
      nextErrors.phone = t("checkout.invalidPhone") || "شماره موبایل معتبر نیست";
      showToast("لطفاً شماره موبایل معتبر وارد کنید.", "error");
    }
    if (!province.trim()) nextErrors.province = t("checkout.required");
    if (!city.trim()) nextErrors.city = t("checkout.required");
    if (!address.trim()) {
      nextErrors.address = t("checkout.required");
      showToast(t("checkout.required"), "error");
    }
    if (!/^\d{10}$/.test(postalCode.replace(/\D/g, ""))) nextErrors.postalCode = t("checkout.invalidPostal");
    if (email.trim() && !email.includes("@")) nextErrors.email = t("checkout.invalidEmail");
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const date = new Date().toLocaleDateString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US");
    const fullPhone = toFullIranPhone(phoneLocal);

    try {
      const remote = await createRemoteOrder({
        customer: {
          name: fullName.trim(),
          phone: fullPhone,
          email: email.trim() || undefined,
          province: province.trim(),
          city: city.trim(),
          address: address.trim(),
          postalCode: postalCode.replace(/\D/g, ""),
          notes: notes.trim(),
        },
        items: buildOrderItems(items),
        total,
      });
      const orderNumber = remote.orderNumber;
      const pdfBlob = await generateOrderPdf(
        storedOrderToPdfData(remote, dir, t("cart.toman") || "تومان", orderPdfLabels(t), {
          dateLabel: new Date(remote.createdAt).toLocaleDateString(lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US"),
          orderStatusLabel: t(`status.${remote.status}`),
          paymentStatusLabel: t(`payment.${remote.paymentStatus}`),
        }),
      );

      const delivery = await deliverOrderToSeller(pdfBlob, {
        orderNumber,
        date,
        customerName: fullName.trim(),
        phone: fullPhone,
        notes: notes.trim(),
        items,
        total,
      });

      addOrder({ orderNumber, date, total, itemsCount: items.reduce((s, i) => s + i.quantity, 0), status: remote.status });
      downloadBlob(pdfBlob, remote.document?.filename || `${orderNumber}.pdf`);
      showToast(t("notifications.pdfGenerated") || "فایل PDF سفارش تولید شد", "success");

      setResult({
        orderNumber,
        date,
        pdfBlob,
        sent: delivery.sent,
        paymentStatus: remote.paymentStatus,
        status: remote.status,
      });
      clearCart();
    } catch {
      showToast(t("errors.generic") || "خطا در تولید سفارش", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    goBack(navigate, "/cart");
  };

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="glass-strong animate-pop mx-auto flex flex-col items-center gap-4 rounded-3xl p-8" style={{ border: "1px solid var(--border-soft)" }}>
          <PackageCheck size={48} className="text-green-500" />
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t("checkout.successTitle") || "سفارش شما با موفقیت ثبت شد!"}
          </h1>
          <p className="text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            {t("checkout.successDesc") || "فایل PDF سفارش آماده است. برای تکمیل خرید آن را دانلود نمایید."}
          </p>
          <div className="glass w-full rounded-2xl p-4 text-sm" style={{ color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}>
            <div className="flex justify-between py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("checkout.orderNumber")}</span>
              <span className="font-bold text-violet-400">{result.orderNumber}</span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("checkout.date")}</span>
              <span className="font-bold">{result.date}</span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("admin.status")}</span>
              <span className="font-bold">{t(`status.${result.status}`)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: "var(--text-muted)" }}>{t("checkout.paymentStatus")}</span>
              <span className="font-bold">{t(`payment.${result.paymentStatus}`)}</span>
            </div>
          </div>

          <button
            onClick={() => downloadBlob(result.pdfBlob, `${result.orderNumber}.pdf`)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] active:scale-95"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            <FileDown size={16} />
            <span>{t("checkout.downloadPdf") || "دانلود PDF سفارش"}</span>
          </button>

          <div
            className="flex w-full items-start gap-2 rounded-2xl p-3.5 text-start text-xs leading-5"
            style={{ background: "var(--chip-bg)", color: "var(--text-secondary)" }}
          >
            <Send size={15} className="mt-0.5 shrink-0 text-green-400" />
            <span>فایل PDF سفارش شما با موفقیت تولید شد و آماده دانلود است.</span>
          </div>

          <Link to="/" className="text-sm font-semibold" style={{ color: "var(--accent-1)" }}>
            {t("errors.goHome") || "بازگشت به صفحه اصلی"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
      <OverlayHeader
        onBack={handleBack}
        backLabel={t("checkout.backToCart") || "بازگشت به سبد"}
        titleClassName="ks-overlay-title-sm"
        title={<h1 className="ks-overlay-title ks-overlay-title-sm">{t("checkout.title")}</h1>}
      />

      <form onSubmit={handleSubmit} className="glass flex flex-col gap-4 rounded-3xl p-5 sm:p-7" style={{ border: "1px solid var(--border-soft)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {t("checkout.customerInfo")}
        </h2>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.fullName")} <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="مثال: علی محمدی"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500"
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
          />
          {errors.name && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.phone")} <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <div className="flex items-center gap-2" dir="ltr">
            <span className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: "var(--chip-bg)", color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}>
              +98
            </span>
            <input
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(normalizeIranLocal(e.target.value))}
              placeholder="9XX XXX XXXX"
              inputMode="numeric"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500"
              style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
            />
          </div>
          {errors.phone && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            dir="ltr"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500"
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
          />
          {errors.email && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.email}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("checkout.province")} <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
            />
            {errors.province && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.province}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("checkout.city")} <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
            />
            {errors.city && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.city}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.address")} <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500"
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
          />
          {errors.address && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.address}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.postalCode")} <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
          />
          {errors.postalCode && <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{errors.postalCode}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {t("checkout.notes")} (اختیاری)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("checkout.notesPlaceholder")}
            rows={3}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500"
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
      </form>
    </div>
  );
}
