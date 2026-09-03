import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminLoginPage() {
  const { t, dir } = useLanguage();
  const { token, ready, login } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (ready && token) return <Navigate to="/admin/orders" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(username, password);
    } catch {
      setError(t("admin.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10" dir={dir}>
      <div className="glass-strong rounded-[2rem] p-6 sm:p-7" style={{ border: "1px solid var(--border-soft)" }}>
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>{t("admin.title")}</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{t("admin.username")}</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
            style={{ background: "var(--input-bg)", color: "var(--text-primary)", border: "1px solid var(--border-soft)" }}
          />
          <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{t("admin.password")}</label>
          <div className="relative" dir="ltr">
            <button
              type="button"
              onClick={() => setShowPassword((open) => !open)}
              aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
              className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-1"
              style={{ color: "var(--text-muted)" }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl py-2.5 pr-3.5 text-sm outline-none"
              style={{
                background: "var(--input-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-soft)",
                paddingLeft: "2.4rem",
              }}
            />
          </div>
          {error && <p className="text-xs" style={{ color: "var(--danger)" }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            {submitting ? t("common.loading") : t("admin.login")}
          </button>
        </form>
      </div>
    </div>
  );
}
