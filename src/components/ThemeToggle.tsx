import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? t("theme.light") : t("theme.dark")}
      aria-label="toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-transform duration-300 hover:scale-110 hover:bg-white/10"
    >
      {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
