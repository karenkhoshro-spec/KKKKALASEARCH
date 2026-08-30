import { useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import SearchBar from "../components/SearchBar";
import CategoryNav from "../components/CategoryNav";
import { HorizontalBrandingLogo } from "../components/BrandingLogo";

export default function Home() {
  const { t } = useLanguage();
  const { setListContext } = useListContext();

  useEffect(() => {
    setListContext({ type: "home" });
  }, [setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      {/* 1. Main Homepage Hero: Horizontal Logo + Tagline + Search Box */}
      <section className="mb-10 flex flex-col items-center text-center">
        {/* Horizontal KalaSearch Logo */}
        <div className="mb-3">
          <HorizontalBrandingLogo showTagline={false} />
        </div>

        {/* Tagline (not a second brand name) */}
        <p className="animate-fade-up mx-auto max-w-xl text-base font-extrabold sm:text-lg" style={{ color: "var(--text-secondary)", animationDelay: "0.05s" }}>
          {t("home.heroTitle")}
        </p>

        <h2
          className="mt-5 text-lg font-black tracking-tight sm:text-xl"
          style={{ color: "var(--text-primary)" }}
        >
          {t("home.smartSearch")}
        </h2>

        {/* Search Box */}
        <div className="mt-3 w-full max-w-2xl">
          <SearchBar large />
        </div>
      </section>

      {/* 2. Primary Categories Grid */}
      <section className="mb-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            {t("home.categoriesTitle")}
          </h2>
        </div>
        <CategoryNav />
      </section>

    </div>
  );
}
