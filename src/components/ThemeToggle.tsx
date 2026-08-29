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
      className={`ks-crystal-theme-switch flex items-center justify-center transition-all duration-300 ${
        showLabel
          ? "h-10 gap-2 rounded-2xl px-3.5 text-xs font-bold"
          : "h-9 w-9 rounded-full"
      }`}
    >
      <span className="relative z-10 flex items-center justify-center">
        {isDark ? (
          <Moon size={showLabel ? 16 : 18} className="text-violet-300 transition-transform duration-300 hover:-rotate-12" />
        ) : (
          <Sun size={showLabel ? 16 : 18} className="text-amber-500 transition-transform duration-300 hover:rotate-45" />
        )}
      </span>
      {showLabel && (
        <span className="relative z-10">{isDark ? t("theme.dark") : t("theme.light")}</span>
      )}
    </button>
  );
}
