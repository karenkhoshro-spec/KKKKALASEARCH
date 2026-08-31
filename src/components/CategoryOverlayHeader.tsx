import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { goBack } from "../utils/safeBack";
import CategoryIcon from "./CategoryIcon";
import OverlayHeader from "./OverlayHeader";
import "./CategoryNav.css";

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
  const { t } = useLanguage();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    goBack(navigate, to || "/");
  };

  return (
    <OverlayHeader
      onBack={handleBack}
      leading={
        productCount !== undefined ? (
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
        )
      }
      title={
        <div
          className="glass-strong flex max-w-full items-center gap-2 rounded-2xl px-3.5 py-1.5 sm:px-6 sm:py-2"
          style={{
            border: "1.5px solid var(--border-strong)",
            background: "var(--surface-strong)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.15)",
          }}
        >
          <div className="ks-icon-3d flex h-7 w-7 shrink-0 items-center justify-center sm:h-8 sm:w-8">
            <CategoryIcon id={categoryId} size={18} />
          </div>
          <h1 className="truncate text-sm font-black tracking-tight sm:text-base md:text-lg" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
      }
    />
  );
}
