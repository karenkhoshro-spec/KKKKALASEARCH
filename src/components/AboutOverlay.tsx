import { useEffect } from "react";
import { ArrowRight, ArrowLeft, Search, Layers, FileCheck, Sparkles, X, ShieldCheck } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import OrderXLogo from "./OrderXLogo";
import { useUiLayer } from "../context/UiLayerContext";

interface AboutOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutOverlay({ open, onClose }: AboutOverlayProps) {
  const { t, dir } = useLanguage();
  const ArrowIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  useUiLayer(open, onClose);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3.5 sm:p-6" dir={dir}>
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Crystal Glass Modal Container */}
      <div
        className="glass-strong relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl animate-pop"
        style={{
          borderColor: "var(--border-strong)",
          background: "var(--surface-strong)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px var(--accent-glow)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-overlay-title"
      >
        {/* Overlay Header: Back on Right in RTL, Title in Middle, Close on Left in RTL */}
        <div
          className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 border-b px-4 py-3 sm:px-6 sm:py-4"
          style={{ borderColor: "var(--border-soft)" }}
        >
          {/* Back Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("category.back") || "بازگشت"}
            className="ks-back-button"
          >
            <ArrowIcon size={16} />
            <span>{t("category.back") || "بازگشت"}</span>
          </button>

          {/* Centered Title Capsule */}
          <div className="flex items-center justify-center">
            <div
              className="glass-strong flex items-center gap-2 rounded-2xl px-3.5 py-1.5 sm:px-5 sm:py-2"
              style={{
                border: "1.2px solid var(--border-strong)",
                background: "var(--surface)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              }}
            >
              <h2 id="about-overlay-title" className="text-xs font-black sm:text-sm md:text-base" style={{ color: "var(--text-primary)" }}>
                {t("aboutModal.title") || "درباره OrderX"}
              </h2>
            </div>
          </div>

          {/* Close Icon Capsule */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("menu.close") || "بستن"}
            className="glass flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 sm:h-9 sm:w-9 cursor-pointer"
            style={{
              color: "var(--text-primary)",
              borderColor: "var(--border-soft)",
              background: "var(--surface)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col items-center text-center">
            {/* Logo Brand Showcase */}
            <div className="glass mb-4 flex items-center justify-center rounded-3xl p-4 shadow-[var(--shadow-glow)]" style={{ border: "1.5px solid var(--border-strong)", background: "var(--accent-1)" }}>
              <OrderXLogo />
            </div>

            <h3 className="text-base font-extrabold sm:text-lg" style={{ color: "var(--text-primary)" }}>
              {t("aboutModal.subtitle") || "پلتفرم جامع جستجو و انتخاب محصولات پلاستیکی"}
            </h3>

            <p className="mt-3 text-xs leading-6 sm:text-sm sm:leading-7" style={{ color: "var(--text-secondary)" }}>
              {t("aboutModal.intro") || "OrderX پلتفرم تخصصی و هوشمند جستجو، بررسی و دسترسی به تنوع گسترده محصولات پلاستیکی خانگی، آشپزخانه و بهداشتی است."}
            </p>
          </div>

          {/* 4 Feature Crystal Cards */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Card 1 */}
            <div
              className="glass flex items-start gap-3 rounded-2xl p-3.5 transition-all duration-200"
              style={{
                border: "1px solid var(--border-soft)",
                background: "var(--surface)",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}
              >
                <Search size={18} />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-extrabold sm:text-sm" style={{ color: "var(--text-primary)" }}>
                  {t("aboutModal.feature1Title") || "جستجوی هوشمند و سریع"}
                </h4>
                <p className="mt-1 text-[11px] leading-5 sm:text-xs" style={{ color: "var(--text-secondary)" }}>
                  {t("aboutModal.feature1Desc") || "امکان جستجو و فیلتر دقیق در میان صدها محصول و تنوع رنگی با نمایش آنی نتایج"}
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="glass flex items-start gap-3 rounded-2xl p-3.5 transition-all duration-200"
              style={{
                border: "1px solid var(--border-soft)",
                background: "var(--surface)",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--chip-bg)", color: "var(--accent-2)" }}
              >
                <Layers size={18} />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-extrabold sm:text-sm" style={{ color: "var(--text-primary)" }}>
                  {t("aboutModal.feature2Title") || "مشخصات فنی و دسته‌بندی شفاف"}
                </h4>
                <p className="mt-1 text-[11px] leading-5 sm:text-xs" style={{ color: "var(--text-secondary)" }}>
                  {t("aboutModal.feature2Desc") || "دسترسی به ابعاد، بسته‌بندی، کد محصول و لینک مستقیم مشخصات کالاها"}
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              className="glass flex items-start gap-3 rounded-2xl p-3.5 transition-all duration-200"
              style={{
                border: "1px solid var(--border-soft)",
                background: "var(--surface)",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--chip-bg)", color: "var(--accent-3)" }}
              >
                <FileCheck size={18} />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-extrabold sm:text-sm" style={{ color: "var(--text-primary)" }}>
                  {t("aboutModal.feature3Title") || "درخواست سفارش و پیش‌فاکتور"}
                </h4>
                <p className="mt-1 text-[11px] leading-5 sm:text-xs" style={{ color: "var(--text-secondary)" }}>
                  {t("aboutModal.feature3Desc") || "ثبت آسان اقلام، مشاهده سبد خرید و دریافت پیش‌فاکتور رسمی به همراه استعلام تولید"}
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div
              className="glass flex items-start gap-3 rounded-2xl p-3.5 transition-all duration-200"
              style={{
                border: "1px solid var(--border-soft)",
                background: "var(--surface)",
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "var(--chip-bg)", color: "var(--accent-1)" }}
              >
                <Sparkles size={18} />
              </div>
              <div className="flex flex-col">
                <h4 className="text-xs font-extrabold sm:text-sm" style={{ color: "var(--text-primary)" }}>
                  {t("aboutModal.feature4Title") || "تجربه کاربری کریستالی مدرن"}
                </h4>
                <p className="mt-1 text-[11px] leading-5 sm:text-xs" style={{ color: "var(--text-secondary)" }}>
                  {t("aboutModal.feature4Desc") || "طراحی شیک و واکنش‌گرا با پشتیبانی کامل از حالت‌های روز و شب در انواع دستگاه‌ها"}
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badge / Safe shopping notice */}
          <div
            className="glass mt-5 flex items-center justify-center gap-2 rounded-2xl p-3 text-center text-xs font-semibold"
            style={{
              background: "var(--chip-bg)",
              borderColor: "var(--border-soft)",
              color: "var(--text-primary)",
            }}
          >
            <ShieldCheck size={16} style={{ color: "var(--accent-1)" }} />
            <span>خرید راحت، مطمئن و مستقیم محصولات پلاستیکی با ضمانت اصالت و کیفیت کالا</span>
          </div>
        </div>
      </div>
    </div>
  );
}
