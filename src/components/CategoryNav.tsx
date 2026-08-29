import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { categories } from "../data/categories";
import CategoryIcon from "./CategoryIcon";
import "./CategoryNav.css";

export default function CategoryNav() {
  const { lang } = useLanguage();

  const mainCategories = categories.slice(0, 8);
  const otherCategory = categories[8];

  return (
    <nav className="ks-category-container" aria-label="دسته‌بندی‌های کالا سرچ">
      {/* Row 1: 8 Main Categories */}
      <div className="ks-category-grid-8">
        {mainCategories.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="ks-category-tile animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 0.02, 0.2)}s` }}
            aria-label={cat.name[lang]}
          >
            <div className="ks-category-icon-wrapper h-5 w-5 sm:h-7 sm:w-7 lg:h-9 lg:w-9">
              <CategoryIcon id={cat.id} size={26} className="h-full w-full object-contain" />
            </div>
            <span className="ks-category-label">
              {cat.name[lang]}
            </span>
          </Link>
        ))}
      </div>

      {/* Row 2: Other Category (Centered) */}
      {otherCategory && (
        <div className="ks-category-row-other">
          <Link
            to={`/category/${otherCategory.id}`}
            className="ks-category-tile ks-category-tile-other animate-fade-up"
            style={{ animationDelay: "0.22s" }}
            aria-label={otherCategory.name[lang]}
          >
            <div className="ks-category-icon-wrapper h-5 w-5 sm:h-7 sm:w-7 lg:h-9 lg:w-9">
              <CategoryIcon id={otherCategory.id} size={26} className="h-full w-full object-contain" />
            </div>
            <span className="ks-category-label">
              {otherCategory.name[lang]}
            </span>
          </Link>
        </div>
      )}
    </nav>
  );
}
