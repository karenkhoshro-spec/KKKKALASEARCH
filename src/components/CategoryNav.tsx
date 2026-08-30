import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { categories } from "../data/categories";
import CategoryIconFrame from "./CategoryIconFrame";
import "./CategoryNav.css";

export default function CategoryNav() {
  const { lang } = useLanguage();

  const mainCategories = categories.slice(0, 8);
  const row1 = mainCategories.slice(0, 4);
  const row2 = mainCategories.slice(4, 8);
  const otherCategory = categories[8];

  return (
    <nav className="ks-category-container" aria-label="دسته‌بندی‌های کالا سرچ">
      <div className="ks-category-grid-4">
        {row1.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="ks-category-tile animate-fade-up"
            style={{ animationDelay: `${Math.min(index * 0.03, 0.2)}s` }}
            aria-label={cat.name[lang]}
          >
            <CategoryIconFrame id={cat.id} size={28} className="h-11 w-11 sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
            <span className="ks-category-label">{cat.name[lang]}</span>
          </Link>
        ))}
      </div>

      <div className="ks-category-grid-4">
        {row2.map((cat, index) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="ks-category-tile animate-fade-up"
            style={{ animationDelay: `${Math.min((index + 4) * 0.03, 0.25)}s` }}
            aria-label={cat.name[lang]}
          >
            <CategoryIconFrame id={cat.id} size={28} className="h-11 w-11 sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
            <span className="ks-category-label">{cat.name[lang]}</span>
          </Link>
        ))}
      </div>

      {otherCategory && (
        <div className="ks-category-row-other">
          <Link
            to={`/category/${otherCategory.id}`}
            className="ks-category-tile ks-category-tile-other animate-fade-up"
            style={{ animationDelay: "0.28s" }}
            aria-label={otherCategory.name[lang]}
          >
            <CategoryIconFrame id={otherCategory.id} size={28} className="h-11 w-11 sm:h-14 sm:w-14 lg:h-16 lg:w-16" />
            <span className="ks-category-label">{otherCategory.name[lang]}</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
