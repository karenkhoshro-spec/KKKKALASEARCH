import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import Logo from "./Logo";
import "./Footer.css";

export default function Footer() {
  const { t, dir } = useLanguage();

  return (
    <footer className="ks-footer mt-10 border-t" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mx-auto max-w-6xl px-4 pt-7 pb-12 sm:px-6">
        <div className="ks-footer-brand-wrap mb-6 flex flex-col items-center overflow-visible text-center">
          <Link to="/" aria-label="بازگشت به صفحه اصلی کالا سرچ" className="ks-footer-brand inline-flex justify-center overflow-visible">
            <Logo />
          </Link>
          <p className="mt-2.5 max-w-md text-xs sm:text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            {t("footer.about")}
          </p>
        </div>

        <div className="border-t pt-6" style={{ borderColor: "var(--border-soft)" }} dir={dir}>
          <h4 className="mb-4 text-center text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {t("footer.quickLinks")}
          </h4>
          <ul className="flex flex-wrap items-center justify-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            <li>
              <Link to="/" className="ks-footer-chip">{t("menu.home")}</Link>
            </li>
            <li>
              <Link to="/products" className="ks-footer-chip">{t("menu.products")}</Link>
            </li>
            <li>
              <Link to="/search" className="ks-footer-chip">{t("home.searchCta")}</Link>
            </li>
            <li>
              <Link to="/cart" className="ks-footer-chip">{t("menu.cart")}</Link>
            </li>
            <li>
              <Link to="/account" className="ks-footer-chip">{t("menu.account")}</Link>
            </li>
            <li>
              <Link to="/wishlist" className="ks-footer-chip">{t("menu.wishlist")}</Link>
            </li>
          </ul>
        </div>

        <div className="mt-8 border-t pt-5 text-center text-xs" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Kala Search — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
