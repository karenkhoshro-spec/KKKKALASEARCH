import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  return (
    <button onClick={toggleTheme} title={isDark ? t("theme.light") : t("theme.dark")} aria-label={isDark ? t("theme.light") : t("theme.dark")} aria-pressed={isDark} className={`flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105 hover:bg-white/10 ${showLabel ? "h-10 gap-2 px-3 text-xs font-bold" : "h-9 w-9 text-base"}`} style={{ color: "var(--text-primary)" }}>
      {isDark ? <Moon size={showLabel ? 18 : 20} /> : <Sun size={showLabel ? 18 : 20} />}
      {showLabel && <span>{isDark ? t("theme.dark") : t("theme.light")}</span>}
    </button>
  );
}
