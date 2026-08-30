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

/** Isolated 3D shopping-bag mark — no photo frame, no cream/navy backdrop. */
export default function BrandMark({ size = 56 }: { size?: number }) {
  const theme = useSafeTheme();
  const dark = theme === "dark";
  const id = dark ? "d" : "l";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      aria-hidden="true"
      className="ks-brand-mark shrink-0"
    >
      <defs>
        <linearGradient id={`h-${id}`} x1="18" y1="6" x2="42" y2="28">
          <stop offset="0%" stopColor={dark ? "#ddd6fe" : "#fdba74"} />
          <stop offset="100%" stopColor={dark ? "#7c3aed" : "#ea580c"} />
        </linearGradient>
        <linearGradient id={`a-${id}`} x1="8" y1="20" x2="40" y2="68">
          <stop offset="0%" stopColor={dark ? "#e9d5ff" : "#fed7aa"} />
          <stop offset="45%" stopColor={dark ? "#a78bfa" : "#fb923c"} />
          <stop offset="100%" stopColor={dark ? "#5b21b6" : "#c2410c"} />
        </linearGradient>
        <linearGradient id={`b-${id}`} x1="28" y1="22" x2="66" y2="68">
          <stop offset="0%" stopColor={dark ? "#c4b5fd" : "#bbf7d0"} />
          <stop offset="55%" stopColor={dark ? "#7c3aed" : "#22c55e"} />
          <stop offset="100%" stopColor={dark ? "#4c1d95" : "#15803d"} />
        </linearGradient>
        <filter id={`g-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={dark ? 1.6 : 0.8} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M22 26c0-10 6-18 14-18s14 8 14 18"
        stroke={`url(#h-${id})`}
        strokeWidth="7"
        strokeLinecap="round"
        filter={`url(#g-${id})`}
      />
      <path d="M10 26h32l-5 38H18c-5 0-8-4-9-8L10 26z" fill={`url(#a-${id})`} />
      <path d="M28 26h34l-4 34c-1 5.5-5 10-11 10H30" fill={`url(#b-${id})`} />
      <path d="M14 30c8-4 16-2 24 1" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="44" r="10" fill={dark ? "#1e1b4b" : "#ecfdf5"} />
      <circle cx="46" cy="44" r="6.2" stroke={dark ? "#f5d0fe" : "#166534"} strokeWidth="3" />
      <path d="M51.5 50.5 59 58" stroke={dark ? "#f5d0fe" : "#166534"} strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}
