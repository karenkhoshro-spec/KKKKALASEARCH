import { useTheme } from "../context/ThemeContext";

interface LogoProps {
  compact?: boolean;
  variant?: "vertical" | "horizontal";
}

export default function Logo({ compact = false, variant }: LogoProps) {
  const { theme } = useTheme();
  const isVertical = variant === "vertical" || compact;

  const assetSrc = isVertical
    ? "/branding/kalasearch-vertical.png"
    : "/branding/kalasearch-horizontal.png";

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none overflow-hidden transition-transform duration-200 hover:opacity-95 ${
        isVertical
          ? "w-24 h-20 sm:w-28 sm:h-24 rounded-2xl"
          : "h-8 sm:h-10 w-32 sm:w-40"
      }`}
      aria-label="KalaSearch"
    >
      <img
        src={assetSrc}
        alt="Kala Search Logo"
        className="absolute select-none pointer-events-none max-w-none"
        style={{
          width: isVertical ? "200%" : "100%",
          height: isVertical ? "170%" : "210%",
          objectFit: "cover",
          objectPosition: isVertical
            ? (theme === "dark" ? "right 10%" : "left 10%")
            : (theme === "dark" ? "center bottom" : "center top"),
        }}
      />
    </div>
  );
}
