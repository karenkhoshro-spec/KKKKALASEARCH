import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Layers, Heart, ShoppingCart } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useListContext } from "../context/ListContext";
import SearchBar from "../components/SearchBar";
import CategoryNav from "../components/CategoryNav";

export default function Home() {
  const { t } = useLanguage();
  const { setListContext } = useListContext();

  useEffect(() => {
    setListContext({ type: "home" });
  }, [setListContext]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      {/* 1. Prominent search hero */}
      <section className="mb-8 text-center">
        <p className="animate-fade-up mx-auto mt-2 max-w-xl text-sm font-extrabold sm:text-base" style={{ color: "var(--text-secondary)", animationDelay: "0.05s" }}>
          {(() => {
            const subtitle = t("home.heroSubtitle");
            const marker = "خانگی";
            const [before, after] = subtitle.split(marker);
            return after === undefined ? subtitle : <>{before}<span className="mx-1 inline-block text-[1.2em] font-black text-[var(--accent-1)]">{marker}</span>{after}</>;
          })()}
        </p>
        <div className="mt-6">
          <SearchBar large />
        </div>
      </section>

      {/* 2. Quick Access links connected to existing routes */}
      <section className="mb-10">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <Link
            to="/products"
            className="glass inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/50 sm:px-4 sm:py-2.5 sm:text-sm"
            style={{ color: "var(--text-primary)", borderColor: "var(--border-soft)" }}
          >
            <Package size={15} style={{ color: "var(--accent-1)" }} />
            <span>{t("menu.products") || "همه محصولات"}</span>
          </Link>

          <Link
            to="/category/other"
            className="glass inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/50 sm:px-4 sm:py-2.5 sm:text-sm"
            style={{ color: "var(--text-primary)", borderColor: "var(--border-soft)" }}
          >
            <Layers size={15} style={{ color: "var(--accent-2)" }} />
            <span>سایر دسته‌بندی‌ها</span>
          </Link>

          <Link
            to="/wishlist"
            className="glass inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/50 sm:px-4 sm:py-2.5 sm:text-sm"
            style={{ color: "var(--text-primary)", borderColor: "var(--border-soft)" }}
          >
            <Heart size={15} style={{ color: "var(--accent-3)" }} />
            <span>{t("menu.wishlist") || "علاقه‌مندی‌ها"}</span>
          </Link>

          <Link
            to="/cart"
            className="glass inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-500/50 sm:px-4 sm:py-2.5 sm:text-sm"
            style={{ color: "var(--text-primary)", borderColor: "var(--border-soft)" }}
          >
            <ShoppingCart size={15} style={{ color: "var(--accent-1)" }} />
            <span>{t("menu.cart") || "سبد خرید"}</span>
          </Link>
        </div>
      </section>

      {/* 3. Primary Categories Grid */}
      <section className="mb-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--text-primary)" }}>
            {t("home.categoriesTitle")}
          </h2>
        </div>
        <CategoryNav />
      </section>

    </div>
  );
}
