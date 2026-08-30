import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import Logo from "./Logo";
import "./Footer.css";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="ks-footer mt-16 border-t" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col items-center overflow-visible text-center">
          <Link to="/" aria-label="بازگشت به صفحه اصلی کالا سرچ" className="ks-footer-brand inline-flex justify-center overflow-visible">
            <Logo />
          </Link>
          <p className="mt-2.5 max-w-md text-xs sm:text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
            {t("footer.about")}
          </p>
        </div>

        <div className="grid gap-8 border-t pt-8 sm:grid-cols-2" style={{ borderColor: "var(--border-soft)" }}>
          <div>
            <h4 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {t("footer.quickLinks")}
            </h4>
            <ul className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <li><Link to="/" className="ks-footer-link">{t("menu.home")}</Link></li>
              <li><Link to="/search" className="ks-footer-link">{t("home.searchCta")}</Link></li>
              <li><Link to="/account" className="ks-footer-link">{t("menu.account")}</Link></li>
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
