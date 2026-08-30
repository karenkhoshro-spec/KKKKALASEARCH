import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import "./BrandingLogo.css";

const BAG = {
  light: "/images/branding/kalasearch-bag-light.png",
  dark: "/images/branding/kalasearch-bag-dark.png",
};
const NAME_FA = {
  light: "/images/branding/kalasearch-name-fa-light.png",
  dark: "/images/branding/kalasearch-name-fa-dark.png",
};
const NAME_EN = {
  light: "/images/branding/kalasearch-name-en-light.png",
  dark: "/images/branding/kalasearch-name-en-dark.png",
};

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

function RealBrand({
  layout,
  className = "",
}: {
  layout: "horizontal" | "vertical";
  className?: string;
}) {
  const theme = useSafeTheme();
  const { lang } = useLanguage();
  const bag = BAG[theme];
  const nameSrc = lang === "en" ? NAME_EN[theme] : NAME_FA[theme];
  const alt = lang === "en" ? "KalaSearch" : "کالا سرچ";

  return (
    <div className={`ks-real-brand ks-real-brand--${layout} ${className}`}>
      <img src={bag} alt="" className="ks-real-bag" draggable={false} />
      <img src={nameSrc} alt={alt} className="ks-real-name" draggable={false} />
    </div>
  );
}

export function VerticalBrandingLogo({ className = "" }: { className?: string }) {
  return <RealBrand layout="vertical" className={className} />;
}

export function HorizontalBrandingLogo({
  className = "",
  showTagline: _showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return <RealBrand layout="horizontal" className={className} />;
}
