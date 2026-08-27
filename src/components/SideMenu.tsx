import { Link } from "react-router-dom";
import { X, Home, Grid3x3, Package, Heart, ShoppingCart, User, Info, Phone } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

export default function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, dir } = useLanguage();
  const closedTransform = dir === "rtl" ? "translateX(100%)" : "translateX(-100%)";

  const links = [
    { to: "/", label: t("menu.home"), icon: Home },
    { to: "/products", label: t("menu.products"), icon: Package },
    { to: "/wishlist", label: t("menu.wishlist"), icon: Heart },
    { to: "/cart", label: t("menu.cart"), icon: ShoppingCart },
    { to: "/account", label: t("menu.account"), icon: User },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-[150] bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className="glass-strong fixed inset-y-0 start-0 z-[160] flex w-[85%] max-w-xs flex-col overflow-y-auto transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateX(0)" : closedTransform }}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            {t("menu.title")}
          </h2>
          <button
            onClick={onClose}
            aria-label={t("menu.close")}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
          >
            <X size={18} style={{ color: "var(--text-primary)" }} />
          </button>
        </div>

        {/* Mother & daughter feature section — responsive, ~30s animated (Ken Burns),
            structured so a real animated GIF asset can drop in as `image` below. */}
        <div className="mx-4 mt-4 overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border-soft)" }}>
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src="/images/menu-family.jpg"
              alt={t("menu.familyCaption")}
              className="h-full w-full animate-kenburns object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(0deg, rgba(10,6,20,0.75) 0%, rgba(10,6,20,0.05) 60%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-xs font-bold leading-5 text-white">{t("menu.familyCaption")}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-white/80">{t("menu.familySubCaption")}</p>
            </div>
          </div>
        </div>

        <nav className="mt-5 flex flex-col gap-1 px-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
                style={{ color: "var(--text-primary)" }}
              >
                <Icon size={17} style={{ color: "var(--accent-1)" }} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 flex flex-col gap-1 px-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            <Info size={17} style={{ color: "var(--accent-1)" }} />
            {t("menu.about")}
          </div>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            <Phone size={17} style={{ color: "var(--accent-1)" }} />
            {t("menu.contact")}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t px-4 py-4" style={{ borderColor: "var(--border-soft)" }}>
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("menu.language")}
            </p>
            <LanguageSwitcher variant="menu" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("menu.theme")}
            </p>
            <div className="glass rounded-full">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 pb-6 pt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <Grid3x3 size={14} />
          <span>Kala Search © {new Date().getFullYear()}</span>
        </div>
      </aside>
    </>
  );
}
