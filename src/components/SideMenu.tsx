import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Home, Package, Heart, ShoppingCart, User, Info, Phone, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAccount } from "../context/AccountContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import AboutOverlay from "./AboutOverlay";

export default function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, dir } = useLanguage();
  const { account } = useAccount();
  const { count: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const [showAboutOverlay, setShowAboutOverlay] = useState(false);
  const closedTransform = dir === "rtl" ? "translateX(100%)" : "translateX(-100%)";

  const handleOpenAbout = () => {
    onClose();
    setShowAboutOverlay(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className="glass-strong fixed inset-y-0 start-0 z-[160] flex w-[88%] max-w-xs flex-col overflow-y-auto transition-transform duration-300 ease-out"
        style={{
          transform: open ? "translateX(0)" : closedTransform,
          borderInlineEnd: "1px solid var(--border-soft)",
        }}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between border-b px-4 py-3.5" style={{ borderColor: "var(--border-soft)" }}>
          <div className="glass rounded-2xl px-3 py-1.5" style={{ border: "1px solid var(--border-soft)" }}>
            <Logo compact />
          </div>
          <button
            onClick={onClose}
            aria-label={t("menu.close") || "بستن"}
            className="ks-crystal-action-btn flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Family Feature Section */}
        <div className="mx-3.5 mt-3.5 overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-soft)" }}>
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src="/images/menu-family.jpg"
              alt={t("menu.familyCaption")}
              className="h-full w-full animate-kenburns object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg, rgba(10,6,20,0.85) 0%, rgba(10,6,20,0.2) 60%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-xs font-black leading-5 text-white">{t("menu.familyCaption")}</p>
              <p className="mt-0.5 text-[11px] font-medium leading-4 text-white/85">{t("menu.familySubCaption")}</p>
            </div>
          </div>
        </div>

        {/* Uniform Crystal Menu Cards */}
        <nav className="mt-4 flex flex-col gap-2.5 px-3.5">
          {/* Home Card */}
          <Link
            to="/"
            onClick={onClose}
            className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.01] hover:border-violet-500/50 active:scale-95 cursor-pointer"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
              background: "var(--surface)",
              boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                <Home size={17} />
              </div>
              <span>{t("menu.home") || "صفحه اصلی"}</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>›</span>
          </Link>

          {/* Account Card */}
          <Link
            to="/account"
            onClick={onClose}
            className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.01] hover:border-violet-500/50 active:scale-95 cursor-pointer"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
              background: "var(--surface)",
              boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                <User size={17} />
              </div>
              <span className="truncate">
                {account?.name ? t("account.greeting", { name: account.name }) : t("account.loginTitle") || "حساب کاربری"}
              </span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>›</span>
          </Link>

          {/* Cart Card */}
          <Link
            to="/cart"
            onClick={onClose}
            className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.01] hover:border-violet-500/50 active:scale-95 cursor-pointer"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
              background: "var(--surface)",
              boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                <ShoppingCart size={17} />
              </div>
              <span>{t("menu.cart") || "سبد خرید"}</span>
            </div>
            {cartCount > 0 ? (
              <span
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
                style={{ background: "var(--accent-1)" }}
              >
                {cartCount}
              </span>
            ) : (
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>›</span>
            )}
          </Link>

          {/* Wishlist Card */}
          <Link
            to="/wishlist"
            onClick={onClose}
            className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.01] hover:border-violet-500/50 active:scale-95 cursor-pointer"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
              background: "var(--surface)",
              boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-3)" }}>
                <Heart size={17} />
              </div>
              <span>{t("menu.wishlist") || "علاقه‌مندی‌ها"}</span>
            </div>
            {wishlistItems.length > 0 ? (
              <span
                className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white"
                style={{ background: "var(--accent-3)" }}
              >
                {wishlistItems.length}
              </span>
            ) : (
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>›</span>
            )}
          </Link>

          {/* About Us (Glass Crystal Overlay Trigger) */}
          <button
            type="button"
            onClick={handleOpenAbout}
            className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.01] hover:border-violet-500/50 active:scale-95 cursor-pointer text-start"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
              background: "var(--surface)",
              boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                <Info size={17} />
              </div>
              <span>{t("menu.about") || "درباره ما"}</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>›</span>
          </button>

          {/* Contact / Support Card */}
          <div
            className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
              background: "var(--surface)",
              boxShadow: "inset 0 1px 1.5px rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-3)" }}>
                <Phone size={17} />
              </div>
              <span>{t("menu.contact") || "پشتیبانی و ارتباط"}</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--accent-1)" }}>۰۲۱-۱۲۳۴۵۶۷۸</span>
          </div>
        </nav>

        {/* Language & Theme Controls */}
        <div className="mt-4 flex flex-col gap-3 border-t px-4 py-4" style={{ borderColor: "var(--border-soft)" }}>
          <div>
            <p className="mb-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              {t("menu.language")}
            </p>
            <LanguageSwitcher variant="menu" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              {t("menu.theme")}
            </p>
            <div className="glass rounded-full">
              <ThemeToggle showLabel />
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 px-4 pb-5 pt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <Sparkles size={14} style={{ color: "var(--accent-1)" }} />
          <span>Kala Search © {new Date().getFullYear()}</span>
        </div>
      </aside>

      {/* Dedicated Glass Crystal Overlay for About Us */}
      <AboutOverlay open={showAboutOverlay} onClose={() => setShowAboutOverlay(false)} />
    </>
  );
}
