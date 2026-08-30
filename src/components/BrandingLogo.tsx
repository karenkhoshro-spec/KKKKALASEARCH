import { Atom, Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../context/ThemeContext";

function useSafeTheme(): "light" | "dark" {
  try {
    const { theme } = useTheme();
    return theme;
  } catch {
    if (typeof document !== "undefined") {
      const docTheme = document.documentElement.getAttribute("data-theme");
      if (docTheme === "dark" || docTheme === "light") return docTheme;
    }
    return "light";
  }
}

function brandName(lang: string) {
  if (lang === "fa") return "کالا سرچ";
  if (lang === "ar") return "كالا سيرش";
  return "KalaSearch";
}

/**
 * Vertical brand: mark + single language-aware name. No duplicate EN/FA, no photo frame.
 */
export function VerticalBrandingLogo({ className = "" }: { className?: string }) {
  const { lang } = useLanguage();
  useSafeTheme();

  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center select-none ${className}`}>
      <span className="ks-logo-container relative flex h-14 w-14 items-center justify-center shrink-0">
        <span className="ks-logo-glow absolute inset-0 rounded-full blur-md opacity-75" />
        <span className="ks-logo-shell absolute inset-0 rounded-2xl transition-all" />
        <Atom size={32} className="relative animate-spin-slow ks-logo-atom" strokeWidth={2} />
      </span>
      <span className="ks-brand-title text-lg font-black tracking-tight sm:text-xl">
        {brandName(lang)}
      </span>
    </div>
  );
}

/**
 * Horizontal brand: mark + single language-aware name. No duplicate EN line.
 */
export function HorizontalBrandingLogo({
  className = "",
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  const { lang, t } = useLanguage();
  useSafeTheme();

  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 select-none ${className}`}>
      <div className="ks-brand-logo flex items-center gap-3">
        <span className="ks-logo-container relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center shrink-0">
          <span className="ks-logo-glow absolute inset-0 rounded-full blur-md opacity-75" />
          <span className="ks-logo-shell absolute inset-0 rounded-2xl transition-all" />
          <Atom size={26} className="relative animate-spin-slow ks-logo-atom" strokeWidth={2} />
        </span>
        <div className="flex items-center gap-1.5">
          <span className="ks-brand-title text-lg font-black sm:text-xl tracking-tight">
            {brandName(lang)}
          </span>
          <Search size={16} className="shrink-0 ks-logo-search-gem" strokeWidth={2.5} />
        </div>
      </div>
      {showTagline && (
        <p className="mt-0.5 text-center text-xs font-semibold sm:text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("menu.familyCaption")}
        </p>
      )}
    </div>
  );
}
