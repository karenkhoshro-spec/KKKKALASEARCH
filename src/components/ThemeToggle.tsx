import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";
import { Sun, Moon } from "lucide-react";

/**
 * Crystal theme switch — exactly two real icons:
 *   ☀️ Sun  = day mode
 *   🌙 Moon = night mode
 * The icon always shows the mode you will switch TO, wrapped in the same
 * glassy ring language as the rest of the Crystal UI.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  // In night mode we offer the sun (switch to day); in day mode the moon.
  const goingTo = isDark ? t("theme.light") : t("theme.dark");

  return (
    <button
      onClick={toggleTheme}
      title={goingTo}
      aria-label={goingTo}
      className="ks-theme-btn glass relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
      style={{ color: "var(--accent-1)" }}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-60"
        style={{ background: "radial-gradient(circle at 30% 30%, var(--accent-glow), transparent 70%)" }}
      />
      {isDark ? (
        <Sun size={17} strokeWidth={2.2} className="ks-theme-icon relative animate-pop" />
      ) : (
        <Moon size={17} strokeWidth={2.2} className="ks-theme-icon relative animate-pop" />
      )}
    </button>
  );
}
