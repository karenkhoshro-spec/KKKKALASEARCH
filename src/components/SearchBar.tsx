import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import "./SearchBar.css";

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
    <form onSubmit={submit} className="ks-search-form" role="search" aria-label="جستجوی هوشمند کالا سرچ">
      <div className={`ks-search-wrapper ${focused ? "is-focused" : ""}`}>
        <div className={`ks-search-inner ${large ? "py-2 sm:py-2.5" : "py-1.5"}`}>
          <div className="ks-search-icon-wrapper" aria-hidden="true">
            <Search size={large ? 22 : 18} />
          </div>

          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={t("header.searchPlaceholder")}
            className="ks-search-input"
            aria-label={t("header.searchPlaceholder")}
          />

          <button
            type="submit"
            className="ks-gem-button"
            aria-label={t("home.searchCta") || "جستجو"}
          >
            <span className="ks-gem-facet-cut" aria-hidden="true" />
            <Sparkles size={large ? 15 : 13} className="ks-gem-sparkle-icon" aria-hidden="true" />
            <span className="ks-gem-text">{t("home.searchCta") || "جستجو"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
