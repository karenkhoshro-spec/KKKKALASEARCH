import { memo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { categories } from "../data/categories";
import CategoryIconFrame from "./CategoryIconFrame";
import "./CategoryNav.css";

function CategoryNav() {
  const { lang } = useLanguage();

  const mainCategories = categories.slice(0, 8);
  const row1 = mainCategories.slice(0, 4);
  const row2 = mainCategories.slice(4, 8);
  const otherCategory = categories[8];

  return (
    <nav className="ks-category-container" aria-label="دسته‌بندی‌های کالا سرچ">
      <div className="ks-category-grid-4">
        {row1.map((cat) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="ks-category-tile"
            aria-label={cat.name[lang]}
          >
            <CategoryIconFrame id={cat.id} size={22} className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11" />
            <span className="ks-category-label">{cat.name[lang]}</span>
          </Link>
        ))}
      </div>

      <div className="ks-category-grid-4">
        {row2.map((cat) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className="ks-category-tile"
            aria-label={cat.name[lang]}
          >
            <CategoryIconFrame id={cat.id} size={22} className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11" />
            <span className="ks-category-label">{cat.name[lang]}</span>
          </Link>
        ))}
      </div>

      {otherCategory && (
        <div className="ks-category-row-other">
          <Link
            to={`/category/${otherCategory.id}`}
            className="ks-category-tile ks-category-tile-other"
            aria-label={otherCategory.name[lang]}
          >
            <CategoryIconFrame id={otherCategory.id} size={22} className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11" />
            <span className="ks-category-label">{otherCategory.name[lang]}</span>
          </Link>
        </div>
      )}
    </nav>
  );
}

export default memo(CategoryNav);
