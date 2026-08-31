import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

/**
 * Boxed, clearly clickable Back button.
 * - Sits on the RIGHT (start side in RTL) of page headers.
 * - Generous 44px hit area for mobile.
 * - Falls back safely to home when there is no history entry.
 */
export default function BackButton({ to, label }: { to?: string; label?: string }) {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const Icon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={label ?? t("search.back")}
      className="glass-strong group inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.04] hover:shadow-[var(--shadow-glow)] active:scale-95"
      style={{ color: "var(--text-primary)" }}
    >
      <Icon size={17} style={{ color: "var(--accent-1)" }} className="transition-transform duration-200 group-hover:scale-110" />
      {label ?? t("search.back")}
    </button>
  );
}
