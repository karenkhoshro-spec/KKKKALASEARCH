import { useState } from "react";
import { Link } from "react-router-dom";
import { X, Home, Grid3x3, Package, Heart, ShoppingCart, User, Info, Phone, Layers, ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAccount } from "../context/AccountContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";

export default function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, dir } = useLanguage();
  const { account } = useAccount();
  const [showAbout, setShowAbout] = useState(false);
  const closedTransform = dir === "rtl" ? "translateX(100%)" : "translateX(-100%)";

  return (
    <>
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
        {/* Menu Header: Standard Logo ONLY - No extra duplicate spinning icon */}
        <div className="flex items-center justify-between border-b px-4 py-3.5" style={{ borderColor: "var(--border-soft)" }}>
          <div className="glass rounded-2xl px-3 py-1.5" style={{ border: "1px solid var(--border-soft)" }}>
            <Logo compact />
          </div>
          <button
            onClick={onClose}
            aria-label={t("menu.close") || "بستن"}
            className="ks-crystal-close-btn flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "var(--surface-strong)",
              border: "1px solid var(--border-soft)",
              color: "var(--text-primary)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Feature section */}
        <div className="mx-3.5 mt-3.5 overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-soft)" }}>
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src="/images/menu-family.jpg"
              alt={t("menu.familyCaption")}
              className="h-full w-full animate-kenburns object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg, rgba(10,6,20,0.8) 0%, rgba(10,6,20,0.1) 60%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-xs font-extrabold leading-5 text-white">{t("menu.familyCaption")}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-white/80">{t("menu.familySubCaption")}</p>
            </div>
          </div>
        </div>

        {/* Crystal Menu Navigation */}
        <nav className="mt-4 flex flex-col gap-2 px-3.5">
          {/* Home */}
          <Link
            to="/"
            onClick={onClose}
            className="glass flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.01] hover:border-violet-500/50"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
              <Home size={16} />
            </div>
            <span>{t("menu.home") || "صفحه اصلی"}</span>
          </Link>

          {/* Account */}
          <Link
            to="/account"
            onClick={onClose}
            className="glass flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.01] hover:border-violet-500/50"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
              <User size={16} />
            </div>
            <span className="truncate">
              {account?.name ? t("account.greeting", { name: account.name }) : t("account.loginTitle") || "حساب کاربری"}
            </span>
          </Link>

          {/* Grouped: 'محصولات' placed directly beside 'سایر' */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/products"
              onClick={onClose}
              className="glass flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center text-xs font-bold transition-all duration-200 hover:scale-[1.02] hover:border-violet-500/50"
              style={{
                color: "var(--text-primary)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}>
                <Package size={16} />
              </div>
              <span>{t("menu.products") || "همه کالاها"}</span>
            </Link>

            <Link
              to="/category/other"
              onClick={onClose}
              className="glass flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center text-xs font-bold transition-all duration-200 hover:scale-[1.02] hover:border-violet-500/50"
              style={{
                color: "var(--text-primary)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "var(--chip-bg)", color: "var(--accent-2)" }}>
                <Layers size={16} />
              </div>
              <span>سایر دسته‌ها</span>
            </Link>
          </div>

          {/* Cart & Wishlist */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/cart"
              onClick={onClose}
              className="glass flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all duration-200 hover:scale-[1.02] hover:border-violet-500/50"
              style={{
                color: "var(--text-primary)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <ShoppingCart size={15} style={{ color: "var(--accent-1)" }} />
              <span>{t("menu.cart") || "سبد خرید"}</span>
            </Link>

            <Link
              to="/wishlist"
              onClick={onClose}
              className="glass flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold transition-all duration-200 hover:scale-[1.02] hover:border-violet-500/50"
              style={{
                color: "var(--text-primary)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <Heart size={15} style={{ color: "var(--accent-3)" }} />
              <span>{t("menu.wishlist") || "علاقه‌مندی‌ها"}</span>
            </Link>
          </div>
        </nav>

        {/* About Us & Contact */}
        <div className="mt-3 flex flex-col gap-2 px-3.5">
          <button
            type="button"
            onClick={() => setShowAbout((prev) => !prev)}
            className="glass flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all duration-200"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <Info size={15} style={{ color: "var(--accent-1)" }} />
              <span>{t("menu.about") || "درباره ما"}</span>
            </div>
            <ChevronDown size={14} className={`transition-transform duration-200 ${showAbout ? "rotate-180" : ""}`} />
          </button>

          {showAbout && (
            <div
              className="glass animate-fade-in rounded-2xl p-3 text-xs leading-6"
              style={{
                background: "var(--chip-bg)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-soft)",
              }}
            >
              کالا سرچ؛ درگاه هوشمند جستجو، مقایسه و دسترسی مستقیم به تنوع گسترده محصولات پلاستیکی خانگی، آشپزخانه و نظافت با استانداردهای کیفیت روز.
            </div>
          )}

          <div
            className="glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold"
            style={{
              color: "var(--text-primary)",
              border: "1px solid var(--border-soft)",
            }}
          >
            <Phone size={15} style={{ color: "var(--accent-3)" }} />
            <span>{t("menu.contact") || "پشتیبانی و ارتباط"}</span>
          </div>
        </div>

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
          <Grid3x3 size={14} />
          <span>Kala Search © {new Date().getFullYear()}</span>
        </div>
      </aside>
    </>
  );
}
