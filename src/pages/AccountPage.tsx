import { useState } from "react";
import { LogOut, PhoneCall, ShieldCheck, User, PackageSearch } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { normalizeIranLocal, isValidIranLocal, toFullIranPhone } from "../utils/phone";
import BackButton from "../components/BackButton";

export default function AccountPage() {
  const { t } = useLanguage();
  const { account, isLoggedIn, pendingPhone, demoOtp, requestOtp, verifyOtp, updateName, logout, orders } = useAccount();
  const { showToast } = useToast();

  const [phoneLocal, setPhoneLocal] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [name, setName] = useState(account?.name ?? "");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const local = normalizeIranLocal(phoneLocal);
    if (!isValidIranLocal(local)) {
      setPhoneError(t("checkout.invalidPhone"));
      return;
    }
    setPhoneError("");
    requestOtp(toFullIranPhone(local));
    showToast(t("notifications.otpSent"), "info");
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyOtp(otp)) {
      showToast(t("notifications.loginSuccess"), "success");
      setOtp("");
    } else {
      showToast(t("errors.generic"), "error");
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateName(name.trim());
    showToast(t("account.saveName"), "success");
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <BackButton to="/" />
        <h1 className="text-xl font-bold sm:text-2xl" style={{ color: "var(--text-primary)" }}>
          {t("account.title")}
        </h1>
        <span />
      </div>

      {!isLoggedIn ? (
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="mb-5 flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--chip-bg)" }}>
              <User size={26} style={{ color: "var(--accent-1)" }} />
            </div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {t("account.loginTitle")}
            </h2>
          </div>

          {!pendingPhone ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                {t("account.phoneLabel")}
              </label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                  +98
                </span>
                <input
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(normalizeIranLocal(e.target.value))}
                  placeholder={t("account.phonePlaceholder")}
                  inputMode="numeric"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
                />
              </div>
              {phoneError && <p className="text-xs" style={{ color: "var(--danger)" }}>{phoneError}</p>}
              <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-95"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                <PhoneCall size={16} />
                {t("account.sendOtp")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col gap-3">
              <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                {t("account.otpLabel")} — {pendingPhone}
              </label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder={t("account.otpPlaceholder")}
                inputMode="numeric"
                className="w-full rounded-xl px-3.5 py-2.5 text-center text-lg font-bold tracking-[0.3em] outline-none"
                style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
              />
              {demoOtp && (
                <p className="rounded-xl px-3 py-2 text-center text-xs" style={{ background: "var(--chip-bg)", color: "var(--text-secondary)" }}>
                  {t("account.otpHint")} <b style={{ color: "var(--accent-1)" }}>{demoOtp}</b>
                </p>
              )}
              <button
                type="submit"
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-transform hover:scale-[1.01] active:scale-95"
                style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
              >
                <ShieldCheck size={16} />
                {t("account.verify")}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="glass-strong flex items-center gap-4 rounded-3xl p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--chip-bg)" }}>
              <User size={26} style={{ color: "var(--accent-1)" }} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {account?.name ? t("account.greeting", { name: account.name }) : t("account.welcomeBack")}
              </h2>
              <p className="text-xs" dir="ltr" style={{ color: "var(--text-muted)" }}>
                {account?.phone}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveName} className="glass flex flex-col gap-3 rounded-3xl p-5">
            <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("account.nameLabel")}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("account.namePlaceholder")}
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
              style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
            />
            <button
              type="submit"
              className="self-start rounded-xl px-5 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
            >
              {t("account.saveName")}
            </button>
          </form>

          <div className="glass rounded-3xl p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              <PackageSearch size={16} style={{ color: "var(--accent-1)" }} />
              {t("account.myOrders")}
            </h3>
            {orders.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("account.noOrders")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {orders.map((o) => (
                  <div key={o.orderNumber} className="flex items-center justify-between rounded-xl px-3 py-2 text-xs" style={{ background: "var(--chip-bg)" }}>
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>{o.orderNumber}</span>
                    <span style={{ color: "var(--text-muted)" }}>{o.date}</span>
                    <span style={{ color: "var(--accent-1)" }}>{o.total.toLocaleString()} {t("cart.toman")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="glass flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-transform hover:scale-[1.01] active:scale-95"
            style={{ color: "var(--danger)" }}
          >
            <LogOut size={16} />
            {t("account.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
