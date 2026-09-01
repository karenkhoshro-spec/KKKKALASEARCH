import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? t("theme.light") : t("theme.dark")}
      aria-label={isDark ? t("theme.light") : t("theme.dark")}
      aria-pressed={isDark}
      className={`ks-theme-control ${showLabel ? "ks-theme-control-labeled ks-menu-purple-btn" : ""}`}
    >
      <span className={`ks-theme-track ${isDark ? "is-night" : "is-day"}`} aria-hidden="true">
        <Sun size={14} className="ks-theme-sun" fill="currentColor" />
        <Moon size={14} className="ks-theme-moon" fill="currentColor" />
        <span className="ks-theme-knob">
          {isDark ? <Moon size={16} fill="currentColor" /> : <Sun size={16} fill="currentColor" />}
        </span>
      </span>
      {showLabel && (
        <span className="relative z-10 text-xs font-bold">{isDark ? t("theme.dark") : t("theme.light")}</span>
      )}
    </button>
  );
}
