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
      className="mb-5 flex w-full items-center justify-between border-b pb-3.5"
      style={{
        borderColor: "var(--border-soft)",
        direction: "ltr", // Enforces strict Back Button = LEFT, Logo/Title = RIGHT
      }}
    >
      {/* Left Side: Back Button (ALWAYS on LEFT side in both desktop and mobile) */}
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
        <span dir={dir}>{t("category.back") || "بازگشت"}</span>
      </button>

      {/* Right Side: Category Icon / Mini Logo + Title + Optional Count Badge */}
      <div
        className="flex items-center gap-2.5"
        dir={dir}
        style={{ color: "var(--text-primary)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "var(--chip-bg)",
            color: "var(--accent-1)",
            border: "1px solid var(--border-soft)",
          }}
        >
          <CategoryIcon id={categoryId} size={22} />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-extrabold sm:text-xl">
            {title}
          </h1>
          {productCount !== undefined && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
              style={{
                background: "var(--chip-bg)",
                color: "var(--accent-1)",
                border: "1px solid var(--border-soft)",
              }}
            >
              {productCount} {t("category.productsCount") || "محصول"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
