import { useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { categories } from "../data/categories";
import CategoryIcon from "./CategoryIcon";
import "./CategoryNav.css";

export default function CategoryNav() {
  const { lang } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="ks-category-scroll-container relative w-full">
      <div className="ks-category-scroll-mask-start" aria-hidden="true" />
      <div className="ks-category-scroll-mask-end" aria-hidden="true" />

      <div
        ref={scrollRef}
        className="ks-category-grid-2rows no-scrollbar"
        role="navigation"
        aria-label="دسته‌بندی‌ها"
      >
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="ks-category-tile animate-fade-up px-2 py-3 sm:px-3 sm:py-3.5"
            style={{ animationDelay: `${Math.min(index * 0.03, 0.4)}s` }}
            aria-label={cat.name[lang]}
          >
            <div className="mb-1.5 flex h-10 w-10 items-center justify-center sm:h-11 sm:w-11">
              <CategoryIcon id={cat.id} size={34} />
            </div>
            <span
              className="w-full truncate text-[11.5px] font-bold leading-tight sm:text-xs"
              style={{ color: "var(--text-primary)" }}
            >
              {cat.name[lang]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
