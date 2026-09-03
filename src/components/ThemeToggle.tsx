import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <div
      role="group"
      aria-label={t("menu.theme")}
      className={`ks-theme-control ${showLabel ? "ks-theme-control-labeled ks-menu-purple-btn" : ""}`}
    >
      {showLabel && (
        <span className="relative z-10 text-xs font-bold">{isDark ? t("theme.dark") : t("theme.light")}</span>
      )}
      <div className={`ks-theme-track ${isDark ? "is-night" : "is-day"}`}>
        <button
          type="button"
          onClick={() => setTheme("light")}
          aria-pressed={!isDark}
          aria-label={t("theme.light")}
          className={`ks-theme-option ks-theme-sun ${!isDark ? "is-active" : ""}`}
        >
          <Sun size={16} fill="currentColor" />
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          aria-pressed={isDark}
          aria-label={t("theme.dark")}
          className={`ks-theme-option ks-theme-moon ${isDark ? "is-active" : ""}`}
        >
          <Moon size={16} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
