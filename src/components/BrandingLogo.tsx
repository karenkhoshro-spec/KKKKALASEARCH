import { useLanguage } from "../i18n/LanguageContext";
import BrandMark from "./BrandMark";
import "./BrandingLogo.css";

function BrandWord() {
  const { lang } = useLanguage();
  if (lang === "en") {
    return (
      <span className="ks-brand-word ks-brand-en">
        <span className="ks-brand-kala">Kala</span>
        <span className="ks-brand-search">Search</span>
      </span>
    );
  }
  if (lang === "ar") {
    return <span className="ks-brand-word ks-brand-ar">كالا سيرش</span>;
  }
  return (
    <span className="ks-brand-word ks-brand-fa">
      <span className="ks-brand-kala">کالا</span>
      <span className="ks-brand-search">سرچ</span>
    </span>
  );
}

export function VerticalBrandingLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 text-center select-none ${className}`}>
      <BrandMark size={76} />
      <BrandWord />
    </div>
  );
}

export function HorizontalBrandingLogo({
  className = "",
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 select-none ${className}`}>
      <div className="ks-brand-logo flex items-center gap-3">
        <BrandMark size={58} />
        <BrandWord />
      </div>
      {showTagline && (
        <p className="mt-0.5 text-center text-xs font-semibold sm:text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("menu.familyCaption")}
        </p>
      )}
    </div>
  );
}
