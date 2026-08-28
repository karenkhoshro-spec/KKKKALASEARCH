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

  const mainCategories = categories.slice(0, 8);
  const otherCategory = categories[8];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      {/* 12. Prominent search hero */}
      <section className="mb-12 text-center">
        <p className="animate-fade-up mx-auto mt-2 max-w-xl text-sm font-bold sm:text-base" style={{ color: "var(--text-secondary)", animationDelay: "0.05s" }}>
          {t("home.heroSubtitle")}
        </p>
        <div className="mt-6">
          <SearchBar large />
        </div>
      </section>

      <section className="mb-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
            {t("home.categoriesTitle")}
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {mainCategories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="glass animate-fade-up flex min-w-0 flex-col items-center gap-2 rounded-2xl px-1 py-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]">
              <span className="text-2xl">{cat.icon}</span>
              <span className="w-full truncate text-[11px] font-semibold leading-4 sm:text-sm" style={{ color: "var(--text-primary)" }}>{cat.name[lang]}</span>
            </Link>
          ))}
          {otherCategory && <Link to={`/category/${otherCategory.id}`} className="glass animate-fade-up col-span-4 mx-auto flex w-1/2 min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"><span className="text-xl">{otherCategory.icon}</span><span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{otherCategory.name[lang]}</span></Link>}
        </div>
      </section>

    </div>
  );
}
