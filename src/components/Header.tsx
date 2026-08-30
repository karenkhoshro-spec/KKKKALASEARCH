import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ShoppingCart, UserRound } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { HorizontalBrandingLogo } from "./BrandingLogo";
import ThemeToggle from "./ThemeToggle";
import "./Header.css";
import SideMenu from "./SideMenu";

export default function Header() {
  const { t } = useLanguage();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header className="ks-site-header sticky top-0 z-[120] w-full transition-shadow duration-300">
        <div className="glass-strong border-b" style={{ borderColor: "var(--border-soft)" }}>
          <div className="ks-site-header-inner mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 sm:px-6">
            {/* Nav controls group */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                onClick={() => setMenuOpen(true)}
                aria-label={t("header.menu")}
                className="ks-crystal-action-btn"
              >
                <Menu size={18} />
              </button>
              <ThemeToggle />
            </div>

            {/* Center logo */}
            <div className="ks-site-header-brand flex items-center justify-center overflow-visible">
              <Link to="/" aria-label="Kala Search" className="overflow-visible">
                <HorizontalBrandingLogo compact showTagline={false} />
              </Link>
            </div>

            {/* Actions group */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
              <Link
                to="/account"
                aria-label={t("header.account")}
                className="ks-crystal-action-btn"
              >
                <UserRound size={17} />
              </Link>
              <Link
                to="/cart"
                aria-label={t("header.cart")}
                className="ks-crystal-action-btn relative"
              >
                <ShoppingCart size={17} />
                {count > 0 && (
                  <span
                    className="absolute -top-1 -end-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white animate-pop"
                    style={{ background: "var(--accent-1)" }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>
      <SideMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
