import { Atom, Search } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// Support standard asset paths: src/assets/kalasearch-logo.* and src/assets/branding/*
const logoAssets = import.meta.glob<{ default: string }>(
  "../assets/**/*.{png,jpg,jpeg,svg,webp,PNG,JPG,SVG,WEBP}",
  { eager: true }
);

function getLogoSrc(theme: "light" | "dark"): string | undefined {
  const entries = Object.entries(logoAssets);
  if (entries.length === 0) return undefined;

  // 1. Theme-specific horizontal / general logo
  const exact = entries.find(([path]) => {
    const lower = path.toLowerCase();
    return (lower.includes("horizontal") || lower.includes("kalasearch-logo")) && lower.includes(theme);
  });
  if (exact) return exact[1].default;

  // 2. Generic horizontal logo
  const horizontal = entries.find(([path]) => path.toLowerCase().includes("horizontal"));
  if (horizontal) return horizontal[1].default;

  // 3. Main logo
  const main = entries.find(([path]) => path.toLowerCase().includes("kalasearch-logo"));
  if (main) return main[1].default;

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

export default function Logo({ compact = false }: { compact?: boolean }) {
  const theme = useSafeTheme();
  const realLogoSrc = getLogoSrc(theme);
  const brandFa = "کالا سرچ";

  return (
    <div className="ks-brand-logo flex select-none items-center gap-2" style={{ color: "var(--text-primary)" }}>
      {/* Real Logo Asset if present in src/assets/ or src/assets/branding/, else original crystal emblem */}
      {realLogoSrc ? (
        <img
          src={realLogoSrc}
          alt="کالا سرچ — KalaSearch"
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
          {brandFa}
        </span>
        <Search size={compact ? 13 : 15} className="shrink-0 ks-logo-search-gem" strokeWidth={2.5} />
      </div>
    </div>
  );
}
