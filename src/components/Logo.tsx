import { Atom, Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

// Support standard asset path: src/assets/kalasearch-logo.png
const logoAssets = import.meta.glob<{ default: string }>("../assets/kalasearch-logo.{png,jpg,jpeg,svg,webp,PNG,JPG,SVG,WEBP}", { eager: true });
const realLogoSrc = Object.values(logoAssets)[0]?.default;

export default function Logo({ compact = false }: { compact?: boolean }) {
  const { lang } = useLanguage();
  const brandFa = "کالا سرچ";

  return (
    <div className="ks-brand-logo flex select-none items-center gap-2" style={{ color: "var(--text-primary)" }}>
      {/* Real Logo Asset if present in src/assets/kalasearch-logo.png, else original crystal emblem */}
      {realLogoSrc ? (
        <img
          src={realLogoSrc}
          alt="KalaSearch"
          className={`shrink-0 object-contain ${compact ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9"}`}
        />
      ) : (
        <span className={`ks-logo-container relative flex items-center justify-center shrink-0 ${compact ? "h-7 w-7" : "h-8 w-8 sm:h-9 sm:w-9"}`}>
          <span
            className="ks-logo-glow absolute inset-0 rounded-full blur-md opacity-75 transition-opacity"
          />
          <span className="ks-logo-shell absolute inset-0 rounded-xl transition-all" />
          <Atom
            size={compact ? 20 : 24}
            className="relative animate-spin-slow ks-logo-atom"
            strokeWidth={1.9}
          />
        </span>
      )}

      {/* Styled KalaSearch Brand Typography */}
      <div className="flex items-center gap-1.5">
        <span className={`ks-brand-title font-black tracking-tight ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg lg:text-xl"}`}>
          {lang === "fa" ? (
            <span>{brandFa}</span>
          ) : (
            <span className="flex items-baseline gap-1">
              <span>KALA</span>
              <span className="font-semibold opacity-85">
                {lang === "ar" ? "سيرش" : "SEARCH"}
              </span>
            </span>
          )}
        </span>
        <Search size={compact ? 13 : 15} className="shrink-0 ks-logo-search-gem" strokeWidth={2.5} />
      </div>
    </div>
  );
}
