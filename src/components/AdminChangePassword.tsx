import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAdminAuth } from "../context/AdminAuthContext";
import { changeAdminPassword } from "../utils/ordersApi";
import { adminPasswordChangeI18nKey, validateAdminPasswordChange } from "../utils/adminPasswordChange";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="relative" dir="ltr">
        <button
          type="button"
          onClick={() => setShow((open) => !open)}
          className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-1"
          style={{ color: "var(--text-muted)" }}
          aria-label={show ? "hide" : "show"}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-xl py-2 pr-3.5 text-sm outline-none"
          style={{
            background: "var(--input-bg)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-soft)",
            paddingLeft: "2.2rem",
          }}
        />
      </div>
    </label>
  );
}

export default function AdminChangePassword() {
  const { t } = useLanguage();
  const { token } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    const local = validateAdminPasswordChange({ currentPassword, newPassword, confirmPassword });
    if (local) {
      setError(t(adminPasswordChangeI18nKey(local)));
      return;
    }
    if (!token) {
      setError(t("admin.invalidCredentials"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      await changeAdminPassword(token, { currentPassword, newPassword, confirmPassword });
      reset();
      setSuccess(true);
    } catch (err) {
      const code = err instanceof Error ? err.message : "server_error";
      setError(t(adminPasswordChangeI18nKey(code)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--chip-bg)" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-start text-xs font-bold"
        style={{ color: "var(--accent-1)" }}
      >
        <KeyRound size={14} />
        {t("admin.changePassword")}
      </button>
      {open && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2.5">
          <PasswordField
            label={t("admin.currentPassword")}
            value={currentPassword}
            onChange={setCurrent}
            autoComplete="current-password"
          />
          <PasswordField
            label={t("admin.newPassword")}
            value={newPassword}
            onChange={setNext}
            autoComplete="new-password"
          />
          <PasswordField
            label={t("admin.confirmPassword")}
            value={confirmPassword}
            onChange={setConfirm}
            autoComplete="new-password"
          />
          {error && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{error}</p>}
          {success && <p className="text-[11px] font-semibold" style={{ color: "var(--success)" }}>{t("admin.passwordChanged")}</p>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl py-2 text-xs font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            {busy ? t("common.loading") : t("admin.savePassword")}
          </button>
        </form>
      )}
    </div>
  );
}
