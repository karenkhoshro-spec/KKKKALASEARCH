import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import CategoryIcon from "./CategoryIcon";

interface CategoryOverlayHeaderProps {
  categoryId: string;
  title: string;
  to?: string;
}

export default function CategoryOverlayHeader({
  categoryId,
  title,
  to = "/",
}: CategoryOverlayHeaderProps) {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div
      className="mb-5 flex items-center justify-between border-b pb-3.5"
      style={{ borderColor: "var(--border-soft)" }}
    >
      <div className="flex items-center gap-3">
        {/* Compact glass back button */}
        <button
          type="button"
          onClick={handleBack}
          aria-label="بازگشت"
          className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            color: "var(--text-primary)",
            borderColor: "var(--border-soft)",
          }}
        >
          <ArrowIcon size={18} style={{ color: "var(--accent-1)" }} />
        </button>

        {/* Category title with category icon */}
        <h1
          className="flex items-center gap-2.5 text-lg font-extrabold sm:text-2xl"
          style={{ color: "var(--text-primary)" }}
        >
          <CategoryIcon id={categoryId} size={26} />
          <span>{title}</span>
        </h1>
      </div>

      {/* Close button to quickly dismiss the overlay */}
      <button
        type="button"
        onClick={() => navigate("/")}
        aria-label="بستن"
        className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          color: "var(--text-secondary)",
          borderColor: "var(--border-soft)",
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
