import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { categories } from "../data/categories";
import CategoryIcon from "./CategoryIcon";
import "./CategoryNav.css";

export default function CategoryNav() {
  const { lang } = useLanguage();

  const mainCategories = categories.slice(0, 6);
  const otherCategory = categories[6];

  return (
    <nav className="ks-category-container" aria-label="دسته‌بندی‌های کالا سرچ">
      {/* Row 1: 6 Spacious Main Category Cubes */}
      <div className="ks-category-grid-6">
        {mainCategories.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="ks-category-tile animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 0.03, 0.2)}s` }}
            aria-label={cat.name[lang]}
          >
            <div className="ks-category-icon-wrapper h-6 w-6 sm:h-8 sm:w-8 lg:h-11 lg:w-11">
              <CategoryIcon id={cat.id} size={30} className="h-full w-full object-contain" />
            </div>
            <span className="ks-category-label">
              {cat.name[lang]}
            </span>
          </Link>
        ))}
      </div>

      {/* Row 2: Centered "Other" Cube */}
      {otherCategory && (
        <div className="ks-category-row-other">
          <Link
            to={`/category/${otherCategory.id}`}
            className="ks-category-tile ks-category-tile-other animate-fade-up"
            style={{ animationDelay: "0.22s" }}
            aria-label={otherCategory.name[lang]}
          >
            <div className="ks-category-icon-wrapper h-6 w-6 sm:h-8 sm:w-8 lg:h-11 lg:w-11">
              <CategoryIcon id={otherCategory.id} size={30} className="h-full w-full object-contain" />
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
