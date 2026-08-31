import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import { categories } from "../data/categories";
import { products } from "../data/products";
import HeroSlider from "../components/HeroSlider";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const { t, lang } = useLanguage();
  const { setListContext } = useListContext();

  useEffect(() => {
    setListContext({ type: "home" });
  }, [setListContext]);

  const featured = products.slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      {/* 8. Homepage slider — before the search headline section */}
      <section className="mb-8">
        <HeroSlider />
      </section>

      {/* 12. Prominent search hero */}
      <section className="mb-16 text-center sm:mb-20">
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

      <section className="mb-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
            {t("home.categoriesTitle")}
          </h2>
        </div>
        {/* Category grid — slightly smaller cards/icons, breathing room after the search hero */}
        <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-6 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="ks-ring glass animate-fade-up flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
            >
              <span className="ks-icon-orb h-9 w-9 text-base sm:h-10 sm:w-10 sm:text-lg">{cat.icon}</span>
              <span className="text-[11px] font-semibold leading-4 sm:text-xs" style={{ color: "var(--text-primary)" }}>
                {cat.name[lang]}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold sm:text-xl" style={{ color: "var(--text-primary)" }}>
            {t("home.featuredTitle")}
          </h2>
          <Link to="/products" className="text-sm font-semibold transition-opacity hover:opacity-80" style={{ color: "var(--accent-1)" }}>
            {t("home.viewAll")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
