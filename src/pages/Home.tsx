import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import SearchBar from "../components/SearchBar";

export default function Home() {
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();

  useEffect(() => {
    setListContext({ type: "home" });
  }, [setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      {/* Search hero - HeroSlider removed per Implementation 1 */}
      <section className="mb-12 text-center">
        <h1 className="animate-fade-up text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl" style={{ color: "var(--text-primary)" }}>
          {t("home.heroTitle")}
        </h1>
        <p className="animate-fade-up mx-auto mt-2 max-w-xl text-sm sm:text-base" style={{ color: "var(--text-secondary)", animationDelay: "0.05s" }}>
          {t("home.heroSubtitle")}
        </p>
        <div className="mt-6">
          <SearchBar large />
        </div>
      </section>

      {/* Categories - horizontal UI per Implementation 11 */}
      <section className="mb-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
            {t("home.categoriesTitle")}
          </h2>
          <Link to="/products" className="text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: "var(--accent-1)" }}>
            {t("home.viewAll")}
          </Link>
        </div>
        {/* Horizontal scrollable categories - responsive, no overflow */}
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="glass animate-fade-up flex min-w-[92px] shrink-0 flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] sm:min-w-0 sm:shrink"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="line-clamp-2 text-xs font-semibold leading-4 sm:text-sm" style={{ color: "var(--text-primary)" }}>
                {cat.name[lang]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products removed per Implementation 2 - products still accessible via search/category/products */}
    </div>
  );
}
