import { useLanguage } from "../i18n/LanguageContext";
import BrandMark from "./BrandMark";

function brandName(lang: string) {
  if (lang === "fa") return "کالا سرچ";
  if (lang === "ar") return "كالا سيرش";
  return "KalaSearch";
}

export function VerticalBrandingLogo({ className = "" }: { className?: string }) {
  const { lang } = useLanguage();
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 text-center select-none ${className}`}>
      <BrandMark size={72} />
      <span className="ks-brand-title text-lg font-black tracking-tight sm:text-xl">{brandName(lang)}</span>
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
  const { lang, t } = useLanguage();
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 select-none ${className}`}>
      <div className="ks-brand-logo flex items-center gap-3">
        <BrandMark size={52} />
        <span className="ks-brand-title text-xl font-black sm:text-2xl tracking-tight">{brandName(lang)}</span>
      </div>
      {showTagline && (
        <p className="mt-0.5 text-center text-xs font-semibold sm:text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("menu.familyCaption")}
        </p>
      )}
    </div>
  );
}
