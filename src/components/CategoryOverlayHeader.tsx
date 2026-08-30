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
      className="mb-6 flex w-full items-center justify-between border-b pb-4 pt-1"
      style={{
        borderColor: "var(--border-soft)",
      }}
      dir={dir}
    >
      {/* Right side in RTL (Left in LTR): High-Contrast Back Button */}
      <div className="flex shrink-0 items-center justify-start">
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

      {/* Center: Category Title inside Crystal Capsule */}
      <div className="flex flex-1 items-center justify-center px-2">
        <div
          className="glass-strong flex max-w-full items-center gap-2 rounded-2xl px-3 py-1.5 sm:px-5 sm:py-2"
          style={{
            border: "1.2px solid var(--border-strong)",
            background: "var(--surface-strong)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
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
          <h1 className="truncate text-xs font-black sm:text-sm md:text-base" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Left side in RTL (Right in LTR): Product Count in small Crystal Capsule */}
      <div className="flex shrink-0 items-center justify-end">
        {productCount !== undefined ? (
          <span
            className="glass rounded-full px-2.5 py-1 text-[11px] font-bold sm:px-3.5 sm:text-xs"
            style={{
              background: "var(--chip-bg)",
              color: "var(--accent-1)",
              border: "1px solid var(--border-soft)",
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
