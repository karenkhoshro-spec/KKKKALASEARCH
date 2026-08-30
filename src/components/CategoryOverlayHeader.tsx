import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import CategoryIcon from "./CategoryIcon";

interface CategoryOverlayHeaderProps {
  categoryId: string;
  title: string;
  productCount?: number;
  to?: string;
  onBack?: () => void;
}

export default function CategoryOverlayHeader({
  categoryId,
  title,
  productCount,
  to = "/",
  onBack,
}: CategoryOverlayHeaderProps) {
  const navigate = useNavigate();
  const { dir, t } = useLanguage();
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (to && to !== "/") {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className="mb-6 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 border-b pb-4 pt-1 sm:gap-4"
      style={{
        borderColor: "var(--border-soft)",
      }}
      dir={dir}
    >
      {/* 1. Right side in RTL (Left in LTR): High-Contrast Back Button */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t("category.back") || "بازگشت"}
          className="ks-back-button"
        >
          <ArrowIcon size={16} />
          <span>{t("category.back") || "بازگشت"}</span>
        </button>
      </div>

      {/* 2. Exact Midline Center: Category Title inside High-Visibility Crystal Capsule */}
      <div className="flex items-center justify-center">
        <div
          className="glass-strong flex max-w-full items-center gap-2 rounded-2xl px-3.5 py-1.5 sm:px-6 sm:py-2"
          style={{
            border: "1.5px solid var(--border-strong)",
            background: "var(--surface-strong)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.15)",
          }}
        >
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg sm:h-7 sm:w-7"
            style={{
              background: "var(--chip-bg)",
              color: "var(--accent-1)",
            }}
          >
            <CategoryIcon id={categoryId} size={18} />
          </div>
          <h1 className="truncate text-xs font-black sm:text-sm md:text-base tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
      </div>

      {/* 3. Left side in RTL (Right in LTR): Product Count in Crystal Capsule */}
      <div className="flex items-center justify-end">
        {productCount !== undefined ? (
          <span
            className="glass rounded-full px-3 py-1 text-[11px] font-bold sm:px-3.5 sm:text-xs"
            style={{
              background: "var(--chip-bg)",
              color: "var(--accent-1)",
              border: "1.2px solid var(--border-soft)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            {productCount} {t("category.productsCount") || "محصول"}
          </span>
        ) : (
          <div className="w-8" />
        )}
      </div>
    </div>
  );
}
