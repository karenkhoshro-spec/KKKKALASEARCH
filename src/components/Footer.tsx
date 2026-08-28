import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import Logo from "./Logo";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-16 border-t" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              {t("footer.about")}
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {t("footer.quickLinks")}
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
              {t("footer.contact")}
            </h4>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Ashkan Plastic × Kala Search</p>
          </div>
        </div>
        <div className="mt-8 border-t pt-5 text-center text-xs" style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Kala Search — {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
