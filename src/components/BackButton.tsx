import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * In-site back control. It mirrors the device BACK button behaviour:
 * when an earlier in-site entry exists (product → its category/search page,
 * category → homepage…), it navigates the real history back; otherwise it
 * falls back to the provided destination so navigation never leaves the app.
 */
export default function BackButton({ to, label }: { to?: string; label?: string }) {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const Icon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const handleClick = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else if (to) {
      navigate(to);
    } else {
      navigate("/");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="glass inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-300 hover:scale-[1.03] active:scale-95"
      style={{ color: "var(--text-primary)" }}
    >
      <Icon size={16} style={{ color: "var(--accent-1)" }} />
      {label ?? t("search.back")}
    </button>
  );
}
