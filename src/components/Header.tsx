import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Heart, ShoppingCart } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import SideMenu from "./SideMenu";

export default function Header() {
  const { t } = useLanguage();
  const { count } = useCart();
  const { ids } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[120] w-full transition-shadow duration-300">
        <div className="glass-strong border-b" style={{ borderColor: "var(--border-soft)" }}>
          <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5 sm:px-6">
            {/* Nav controls group */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setMenuOpen(true)}
                aria-label={t("header.menu")}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
                style={{ color: "var(--text-primary)" }}
              >
                <Menu size={19} />
              </button>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>

            {/* Center logo */}
            <div className="flex items-center justify-center">
              <Link to="/" aria-label="Kala Search">
                <Logo />
              </Link>
            </div>

            {/* Actions group - Account moved to SideMenu per Implementation 5 */}
            <div className="flex items-center justify-end gap-0.5 sm:gap-1.5">
              <Link
                to="/wishlist"
                aria-label={t("header.wishlist")}
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              >
                <Heart size={18} style={{ color: "var(--text-primary)" }} />
                {ids.length > 0 && (
                  <span
                    className="absolute -top-0.5 -end-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ background: "var(--accent-3)" }}
                  >
                    {ids.length}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                aria-label={t("header.cart")}
                className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              >
                <ShoppingCart size={18} style={{ color: "var(--text-primary)" }} />
                {count > 0 && (
                  <span
                    className="absolute -top-0.5 -end-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white animate-pop"
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
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
