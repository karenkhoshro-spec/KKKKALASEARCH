import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export default function SearchBar({ large = false }: { large?: boolean }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`);
  };

  return (
    <form onSubmit={submit} className="relative mx-auto w-full max-w-2xl">
      <div
        className={`search-shimmer rounded-[20px] p-[2px] transition-shadow duration-500 ${
          focused ? "shadow-[var(--shadow-glow)]" : ""
        }`}
      >
        <div
          className={`glass-strong flex items-center gap-3 rounded-[18px] px-4 transition-all duration-300 ${
            large ? "py-4 sm:py-5" : "py-3"
          }`}
          style={{ background: "var(--input-bg)" }}
        >
          <Search size={large ? 22 : 18} style={{ color: "var(--accent-1)" }} className={focused ? "animate-pulse" : ""} />
          <input
            dir="auto"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t("header.searchPlaceholder")}
            aria-label={t("header.searchPlaceholder")}
            className={`ks-field w-full flex-1 rounded-md border-0 font-bold bg-transparent outline-none ${
              large ? "text-lg sm:text-xl" : "text-base sm:text-lg"
            }`}
          />
          <button
            type="submit"
            className={`shrink-0 rounded-xl font-bold text-white transition-transform duration-300 hover:scale-105 active:scale-95 ${
              large ? "px-4 py-2.5 text-sm sm:px-5 sm:py-3" : "px-3 py-1.5 text-xs"
            }`}
            style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
          >
            {t("home.searchCta")}
          </button>
        </div>
      </div>
    </form>
  );
}
