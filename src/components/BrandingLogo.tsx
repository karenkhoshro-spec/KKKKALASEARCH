import { Atom, Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../context/ThemeContext";

// Discover all branding asset variants if provided in src/assets/branding/
const brandingAssets = import.meta.glob<{ default: string }>(
  "../assets/branding/*.{png,jpg,jpeg,svg,webp,PNG,JPG,SVG,WEBP}",
  { eager: true }
);

function getBrandingAsset(type: "vertical" | "horizontal", theme: "light" | "dark"): string | undefined {
  const entries = Object.entries(brandingAssets);
  if (entries.length === 0) return undefined;

  // 1. Exact match: kalasearch-logo-{type}-{theme}.*
  const exact = entries.find(([path]) => {
    const lower = path.toLowerCase();
    return lower.includes(type) && lower.includes(theme);
  });
  if (exact) return exact[1].default;

  // 2. Generic match: kalasearch-logo-{type}.*
  const generic = entries.find(([path]) => {
    const lower = path.toLowerCase();
    return lower.includes(type);
  });
  if (generic) return generic[1].default;

  // 3. Fallback to any branding asset if available
  return entries[0]?.[1]?.default;
}

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

/**
 * Vertical Branding Logo (Asset A):
 * Used in Hamburger / Side Menu.
 * Centered, responsive, premium 3D logo + Brand Name + Tagline.
 */
export function VerticalBrandingLogo({ className = "" }: { className?: string }) {
  const theme = useSafeTheme();
  const { lang, t } = useLanguage();
  const assetSrc = getBrandingAsset("vertical", theme);

  if (assetSrc) {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <img
          src={assetSrc}
          alt="کالا سرچ — KalaSearch"
          className="max-h-[140px] w-auto max-w-[210px] object-contain transition-all duration-300 sm:max-h-[160px] sm:max-w-[240px]"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  // Graceful Crystal 3D Vertical Branding Fallback
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-center select-none ${className}`}>
      {/* 3D Basket & Atom Crystal Emblem */}
      <span className="ks-logo-container relative flex h-14 w-14 items-center justify-center shrink-0">
        <span className="ks-logo-glow absolute inset-0 rounded-full blur-md opacity-75" />
        <span className="ks-logo-shell absolute inset-0 rounded-2xl transition-all" />
        <Atom size={32} className="relative animate-spin-slow ks-logo-atom" strokeWidth={2} />
      </span>

      {/* Brand Names */}
      <div className="flex flex-col items-center">
        <span className="ks-brand-title text-lg font-black tracking-tight sm:text-xl">
          {lang === "fa" ? "کالا سرچ" : "KalaSearch"}
        </span>
        <span className="text-[11px] font-extrabold tracking-widest uppercase opacity-75 sm:text-xs" style={{ color: "var(--accent-1)" }}>
          KalaSearch
        </span>
      </div>

      {/* Tagline */}
      <p className="max-w-[200px] text-[11px] font-medium leading-4 opacity-85" style={{ color: "var(--text-secondary)" }}>
        {t("menu.familyCaption") || "خرید راحت، مطمئن و خانوادگی"}
      </p>
    </div>
  );
}

/**
 * Horizontal Branding Logo (Asset B):
 * Used in Homepage Hero and Footer (before Quick Search).
 * Responsive horizontal alignment with 3D logo + Brand Name + Tagline.
 */
export function HorizontalBrandingLogo({
  className = "",
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  const theme = useSafeTheme();
  const { lang, t } = useLanguage();
  const assetSrc = getBrandingAsset("horizontal", theme);

  if (assetSrc) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <img
          src={assetSrc}
          alt="کالا سرچ — KalaSearch"
          className="max-h-[64px] w-auto max-w-[280px] object-contain transition-all duration-300 sm:max-h-[76px] sm:max-w-[340px]"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  // Graceful Crystal 3D Horizontal Branding Fallback
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 select-none ${className}`}>
      <div className="ks-brand-logo flex items-center gap-3">
        {/* 3D Basket & Atom Crystal Emblem */}
        <span className="ks-logo-container relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center shrink-0">
          <span className="ks-logo-glow absolute inset-0 rounded-full blur-md opacity-75" />
          <span className="ks-logo-shell absolute inset-0 rounded-2xl transition-all" />
          <Atom size={26} className="relative animate-spin-slow ks-logo-atom" strokeWidth={2} />
        </span>

        {/* Brand Names */}
        <div className="flex flex-col items-start justify-center">
          <div className="flex items-center gap-1.5">
            <span className="ks-brand-title text-lg font-black sm:text-xl tracking-tight">
              {lang === "fa" ? "کالا سرچ" : "KalaSearch"}
            </span>
            <Search size={16} className="shrink-0 ks-logo-search-gem" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase opacity-75 sm:text-xs" style={{ color: "var(--accent-1)" }}>
            KALASEARCH
          </span>
        </div>
      </div>

      {/* Tagline */}
      {showTagline && (
        <p className="mt-0.5 text-center text-xs font-semibold sm:text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("menu.familyCaption") || "خرید راحت، مطمئن و خانوادگی"}
        </p>
      )}
    </div>
  );
}
