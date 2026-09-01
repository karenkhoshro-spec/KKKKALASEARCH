import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export default function OverlayHeader({
  title,
  onBack,
  backLabel,
  leading,
  titleClassName = "",
}: {
  title?: ReactNode;
  onBack: () => void;
  backLabel?: string;
  leading?: ReactNode;
  titleClassName?: string;
}) {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const label = backLabel ?? t("category.back") ?? "بازگشت";

  return (
    <div className="ks-overlay-header">
      <div className="ks-overlay-header-leading">{leading}</div>
      {title ? (
        <div className={`ks-overlay-header-title ${titleClassName}`.trim()} dir={dir}>
          {typeof title === "string" ? <h1 className="ks-overlay-title">{title}</h1> : title}
        </div>
      ) : null}
      <button type="button" onClick={onBack} aria-label={label} className="ks-back-button">
        <span dir={dir}>{label}</span>
        <ArrowIcon size={16} />
      </button>
    </div>
  );
}
