import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { categories } from "../data/categories";
import CategoryIcon from "./CategoryIcon";
import "./CategoryNav.css";

export default function CategoryNav() {
  const { lang } = useLanguage();

  // Ensure exactly 14 items: 13 normal categories + 1 "other" category
  const visibleCategories = categories.slice(0, 14);

  return (
    <nav className="ks-category-container" aria-label="دسته‌بندی‌های کالا سرچ">
      <div className="ks-category-grid-14">
        {visibleCategories.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="ks-category-tile animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 0.02, 0.25)}s` }}
            aria-label={cat.name[lang]}
          >
            <div className="ks-category-icon-wrapper h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10">
              <CategoryIcon id={cat.id} size={28} className="h-full w-full object-contain" />
            </div>
            <span className="ks-category-label">
              {cat.name[lang]}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
