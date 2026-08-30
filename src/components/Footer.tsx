import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { HorizontalBrandingLogo } from "./BrandingLogo";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-16 border-t" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* 1. Horizontal KalaSearch Logo right before Quick Search */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" aria-label="بازگشت به صفحه اصلی کالا سرچ" className="inline-block transition-transform hover:scale-105 active:scale-95">
            <HorizontalBrandingLogo showTagline={false} />
          </Link>
          <p className="mt-2.5 max-w-md text-xs sm:text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            {t("footer.about")}
          </p>
        </div>

        {/* 2. Quick Search & Links Grid */}
        <div className="grid gap-8 border-t pt-8 sm:grid-cols-3" style={{ borderColor: "var(--border-soft)" }}>
          <div>
            <h4 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {t("footer.quickLinks") || "جستجوی سریع"}
            </h4>
            <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li><Link to="/" className="transition-colors hover:opacity-80">{t("menu.home")}</Link></li>
              <li><Link to="/products" className="transition-colors hover:opacity-80">{t("menu.products")}</Link></li>
              <li><Link to="/cart" className="transition-colors hover:opacity-80">{t("menu.cart")}</Link></li>
              <li><Link to="/account" className="transition-colors hover:opacity-80">{t("menu.account")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {t("home.categoriesTitle") || "دسته‌بندی‌های برگزیده"}
            </h4>
            <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li><Link to="/category/shopping-basket" className="transition-colors hover:opacity-80">سبد خرید</Link></li>
              <li><Link to="/category/picnic-basket" className="transition-colors hover:opacity-80">سبد پیکنیک</Link></li>
              <li><Link to="/category/stool" className="transition-colors hover:opacity-80">چهارپایه</Link></li>
              <li><Link to="/category/other" className="transition-colors hover:opacity-80">سایر محصولات</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {t("footer.contact")}
            </h4>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Ashkan Plastic × Kala Search</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>پشتیبانی سفارشات و استعلام تلفنی</p>
          </div>
        </div>

        <div className="mt-8 border-t pt-5 text-center text-xs" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Kala Search — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
