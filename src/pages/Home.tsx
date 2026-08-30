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
      <section className="mb-10 flex flex-col items-center overflow-visible text-center">
        <div className="mb-4 overflow-visible">
          <HorizontalBrandingLogo showTagline={false} />
        </div>

        <h2
          className="mt-2 max-w-xl text-lg font-medium tracking-tight sm:text-xl"
          style={{ color: "var(--text-primary)" }}
        >
          {t("home.bestPlasticsLead")}{" "}
          <strong className="font-bold">{t("home.bestPlasticsAccent")}</strong>
        </h2>

        <div className="mt-3 w-full max-w-2xl">
          <SearchBar large />
        </div>
      </section>

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
