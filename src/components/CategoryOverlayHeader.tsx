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
    } else if (to) {
      navigate(to);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className="mb-5 grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 border-b pb-3.5 pt-1 sm:gap-4"
      style={{
        borderColor: "var(--border-soft)",
      }}
      dir={dir}
    >
      {/* Right side in RTL (Left in LTR): Back Button */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t("category.back") || "بازگشت"}
          className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--border-strong)",
            background: "var(--surface-strong)",
            boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        >
          <ArrowIcon size={16} style={{ color: "var(--accent-1)" }} />
          <span>{t("category.back") || "بازگشت"}</span>
        </button>
      </div>

      {/* Center: Category Title inside Crystal Capsule */}
      <div className="flex items-center justify-center">
        <div
          className="glass-strong flex max-w-full items-center gap-2 rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2"
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
      <div className="flex items-center justify-end">
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
          <div className="w-4" />
        )}
      </div>
    </div>
  );
}
