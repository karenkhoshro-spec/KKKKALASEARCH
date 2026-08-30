import { useTheme } from "../context/ThemeContext";

function useSafeTheme(): "light" | "dark" {
  try {
    return useTheme().theme;
  } catch {
    if (typeof document !== "undefined") {
      const docTheme = document.documentElement.getAttribute("data-theme");
      if (docTheme === "dark" || docTheme === "light") return docTheme;
    }
    return "light";
  }
}

/** Isolated shopping-bag mark (no photo frame / background). */
export default function BrandMark({ size = 56 }: { size?: number }) {
  const theme = useSafeTheme();
  const dark = theme === "dark";
  const id = dark ? "dark" : "light";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="ks-brand-mark shrink-0"
    >
      <defs>
        <linearGradient id={`bagA-${id}`} x1="8" y1="10" x2="56" y2="56">
          {dark ? (
            <>
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="55%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4c1d95" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#fdba74" />
              <stop offset="45%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </>
          )}
        </linearGradient>
        <linearGradient id={`bagB-${id}`} x1="20" y1="24" x2="58" y2="60">
          {dark ? (
            <>
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6d28d9" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="100%" stopColor="#16a34a" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d="M20 22c0-8 5.2-14 12-14s12 6 12 14"
        stroke={dark ? "#e9d5ff" : "#fb923c"}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M10 24h28l-4 32H18c-4 0-7.2-3.2-8-7L10 24z"
        fill={`url(#bagA-${id})`}
      />
      <path
        d="M26 24h28l-3.2 28.5c-.6 4.2-4 7.5-8.3 7.5H28"
        fill={`url(#bagB-${id})`}
      />
      <circle cx="40" cy="40" r="7.5" fill={dark ? "#1e1b4b" : "#fff"} opacity="0.92" />
      <circle cx="40" cy="40" r="5" stroke={dark ? "#f5d0fe" : "#166534"} strokeWidth="2.2" />
      <path d="M45 45l5 5" stroke={dark ? "#f5d0fe" : "#166534"} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
