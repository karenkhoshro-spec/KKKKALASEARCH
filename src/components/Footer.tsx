import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import Logo from "./Logo";

/**
 * Crystal footer.
 * - NO contact info at the bottom of the site — contact lives in the
 *   side-menu's contact overlay only.
 * - Quick Access links are spaced generously and each points to a real route.
 * - End-of-site branding: animated logo + KalaSearch + tagline beneath it,
 *   lifted slightly higher than before.
 */
export default function Footer() {
  const { t } = useLanguage();

  const quickLinks = [
    { to: "/", label: t("menu.home") },
    { to: "/products", label: t("menu.products") },
    { to: "/wishlist", label: t("menu.wishlist") },
    { to: "/cart", label: t("menu.cart") },
    { to: "/account", label: t("menu.account") },
  ];

  return (
    <footer className="mt-16 border-t" style={{ borderColor: "var(--border-soft)" }}>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              {t("footer.about")}
            </p>
          </div>
          <div className="sm:justify-self-end">
            <h4 className="mb-3 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {t("footer.quickLinks")}
            </h4>
            <ul className="flex flex-col gap-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="transition-all hover:ps-1 hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* End-of-site branding — animated logo, KalaSearch, tagline underneath; lifted higher */}
        <div className="mt-10 flex flex-col items-center gap-2 pb-4 pt-2">
          <div className="-translate-y-1 scale-110">
            <Logo />
          </div>
          <p className="text-center text-xs leading-5" style={{ color: "var(--text-muted)" }}>
            {t("footer.tagline")}
          </p>
        </div>

        <div
          className="mt-4 border-t pt-5 text-center text-xs"
          style={{ borderColor: "var(--border-soft)", color: "var(--text-muted)" }}
        >
          © {new Date().getFullYear()} Kala Search — {t("footer.rights")}
          <span className="mx-2 opacity-40">·</span>
          <Link to="/admin" className="transition-opacity hover:opacity-80" style={{ color: "var(--text-muted)" }}>
            {t("menu.admin")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
