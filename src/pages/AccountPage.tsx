import { useState, useRef, useEffect } from "react";
import { LogOut, PhoneCall, Mail, User, PackageSearch, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAccount } from "../context/AccountContext";
import { useToast } from "../context/ToastContext";
import { normalizeIranLocal, isValidIranLocal, toFullIranPhone } from "../utils/phone";
import { useNavigate } from "react-router-dom";
import { goBack } from "../utils/safeBack";
import { fetchCustomerOrders, type StoredOrder } from "../utils/ordersApi";
import OverlayHeader from "../components/OverlayHeader";

export default function AccountPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { account, isLoggedIn, pendingPhone, demoOtp, requestOtp, verifyOtp, updateName, logout, orders } = useAccount();
  const { showToast } = useToast();

  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [name, setName] = useState(account?.name ?? "");
  const [remoteOrders, setRemoteOrders] = useState<StoredOrder[]>([]);

  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];



  useEffect(() => {
    if (!account?.phone) {
      setRemoteOrders([]);
      return;
    }
    fetchCustomerOrders(account.phone)
      .then(setRemoteOrders)
      .catch(() => setRemoteOrders([]));
  }, [account?.phone]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === "phone") {
      const local = normalizeIranLocal(phoneLocal);
      if (!isValidIranLocal(local)) {
        setPhoneError(t("checkout.invalidPhone") || "شماره موبایل نامعتبر است");
        return;
      }
      setPhoneError("");
      requestOtp(toFullIranPhone(local));
      showToast(t("notifications.otpSent") || "کد تأیید ارسال شد", "info");
    } else {
      if (!emailInput.trim() || !emailInput.includes("@")) {
        setPhoneError("لطفاً یک ایمیل معتبر وارد کنید");
        return;
      }
      setPhoneError("");
      requestOtp(emailInput.trim());
      showToast(t("notifications.otpSent") || "کد تأیید ارسال شد", "info");
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);

    if (cleanVal && index < 3) {
      digitRefs[index + 1].current?.focus();
    }

    const fullCode = newDigits.join("");
    if (fullCode.length === 4) {
      if (verifyOtp(fullCode)) {
        setVerifiedSuccess(true);
        setTimeout(() => {
          showToast(t("notifications.loginSuccess") || "ورود با موفقیت انجام شد", "success");
          setDigits(["", "", "", ""]);
          setVerifiedSuccess(false);
        }, 1200);
      } else {
        showToast(t("errors.generic") || "کد تأیید نادرست است", "error");
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    updateName(name.trim());
    showToast(t("account.saveName") || "نام با موفقیت ذخیره شد", "success");
  };

  const handleBack = () => {
    goBack(navigate);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-5 sm:px-6">
      <OverlayHeader
        onBack={handleBack}
        title={<h1 className="ks-overlay-title">{t("account.title")}</h1>}
      />

      {!isLoggedIn ? (
        <div className="glass rounded-[2rem] p-6 sm:p-8" style={{ border: "1px solid var(--border-soft)" }}>
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]"
              style={{ background: "var(--chip-bg)" }}
            >
              <User size={26} style={{ color: "var(--accent-1)" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {t("account.loginTitle")}
            </h2>
          </div>

          {!pendingPhone ? (
            <div className="flex flex-col gap-4">
              {/* Method Selector */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl p-1" style={{ background: "var(--input-bg)", border: "1px solid var(--border-soft)" }}>
                <button
                  type="button"
                  onClick={() => { setAuthMethod("phone"); setPhoneError(""); }}
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200"
                  style={{
                    background: authMethod === "phone" ? "var(--surface-strong)" : "transparent",
                    color: authMethod === "phone" ? "var(--accent-1)" : "var(--text-secondary)",
                    boxShadow: authMethod === "phone" ? "0 0 14px var(--accent-glow)" : "none",
                    border: authMethod === "phone" ? "1px solid var(--accent-1)" : "1px solid transparent",
                  }}
                >
                  <PhoneCall size={14} />
                  <span>شماره موبایل</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAuthMethod("email"); setPhoneError(""); }}
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-200"
                  style={{
                    background: authMethod === "email" ? "var(--surface-strong)" : "transparent",
                    color: authMethod === "email" ? "var(--accent-1)" : "var(--text-secondary)",
                    boxShadow: authMethod === "email" ? "0 0 14px var(--accent-glow)" : "none",
                    border: authMethod === "email" ? "1px solid var(--accent-1)" : "1px solid transparent",
                  }}
                >
                  <Mail size={14} />
                  <span>ایمیل</span>
                </button>
              </div>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                {authMethod === "phone" ? (
                  <>
                    <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {t("account.phoneLabel")}
                    </label>
                    <div className="flex items-center gap-2" dir="ltr">
                      <span className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: "var(--chip-bg)", color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}>
                        +98
                      </span>
                      <input
                        value={phoneLocal}
                        onChange={(e) => setPhoneLocal(normalizeIranLocal(e.target.value))}
                        placeholder={t("account.phonePlaceholder") || "9XX XXX XXXX"}
                        inputMode="numeric"
                        className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500"
                        style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      آدرس ایمیل
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500"
                      style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
                    />
                  </>
                )}

                {phoneError && <p className="text-xs" style={{ color: "var(--danger)" }}>{phoneError}</p>}

                <button
                  type="submit"
                  className="mt-2 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.01] active:scale-95"
                  style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
                >
                  <PhoneCall size={16} />
                  <span>{t("account.sendOtp")}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {verifiedSuccess ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center animate-pop">
                  <CheckCircle2 size={48} className="text-green-400" />
                  <div className="text-lg font-black" style={{ color: "var(--success)" }}>
                    ✓ ثبت شد
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    ورود شما با موفقیت تأیید شد
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                      {t("account.otpLabel")} برای:
                    </p>
                    <p className="mt-1 text-sm font-bold" dir="ltr" style={{ color: "var(--accent-1)" }}>
                      {pendingPhone}
                    </p>
                  </div>

                  {/* 4-Digit Futuristic Verification Cells */}
                  <div className="my-2 flex justify-center gap-3" dir="ltr">
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={digitRefs[i]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="h-14 w-12 rounded-2xl text-center text-2xl font-black outline-none transition-all duration-200 focus:scale-105"
                        style={{
                          background: d ? "var(--surface-strong)" : "var(--input-bg)",
                          border: d ? "2px solid var(--accent-1)" : "1.5px solid var(--border-soft)",
                          color: "var(--text-primary)",
                          boxShadow: d ? "0 0 16px var(--accent-glow)" : "none",
                        }}
                      />
                    ))}
                  </div>

                  {demoOtp && (
                    <p className="rounded-xl px-3 py-2 text-center text-xs" style={{ background: "var(--chip-bg)", color: "var(--text-secondary)" }}>
                      {t("account.otpHint")} <b style={{ color: "var(--accent-1)" }}>{demoOtp}</b>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="glass-strong flex items-center gap-4 rounded-[2rem] p-5" style={{ border: "1px solid var(--border-soft)" }}>
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

          <form onSubmit={handleSaveName} className="glass flex flex-col gap-3 rounded-[2rem] p-5" style={{ border: "1px solid var(--border-soft)" }}>
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

          <div className="glass rounded-[2rem] p-5" style={{ border: "1px solid var(--border-soft)" }}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              <PackageSearch size={16} style={{ color: "var(--accent-1)" }} />
              <span>{t("account.myOrders")}</span>
            </h3>
            {remoteOrders.length === 0 && orders.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {t("account.noOrders")}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {(remoteOrders.length > 0
                  ? remoteOrders.map((o) => ({ orderNumber: o.orderNumber, date: o.createdAt, total: o.total, status: o.status }))
                  : orders
                ).map((o) => (
                  <div key={o.orderNumber} className="flex flex-col gap-1 rounded-xl px-3 py-2 text-xs" style={{ background: "var(--chip-bg)" }}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold" style={{ color: "var(--text-primary)" }}>{o.orderNumber}</span>
                      <span style={{ color: "var(--accent-1)" }}>{o.total.toLocaleString()} {t("cart.toman")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "var(--text-muted)" }}>{o.date}</span>
                      {"status" in o && o.status ? <span className="font-bold" style={{ color: "var(--accent-1)" }}>{t(`status.${o.status}`)}</span> : null}
                    </div>
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
            <span>{t("account.logout")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
