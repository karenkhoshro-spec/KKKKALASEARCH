import { Link } from "react-router-dom";
import { Atom, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import BackButton from "../components/BackButton";

/**
 * About Us — brand-level information only.
 * Deliberately contains no invented history, address, phone number, license
 * or unverifiable claims; only what the brand statement itself provides.
 */
export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-2" style={{ direction: "ltr" }}>
        <BackButton to="/" label={t("search.back")} />
        <h1 className="ks-page-title" style={{ color: "var(--text-primary)" }}>
          {t("about.title")}
        </h1>
        <span />
      </div>

      <div className="glass-strong overflow-hidden rounded-3xl">
        <div className="relative flex items-center justify-center gap-3 px-6 py-8" style={{ background: "linear-gradient(135deg, var(--accent-2), var(--accent-1))" }}>
          <Atom size={38} className="text-white" strokeWidth={1.6} />
          <span className="text-3xl font-black text-white drop-shadow-sm">{t("about.brand")}</span>
          <Search size={22} className="text-white/90" strokeWidth={2.6} />
          <Sparkles size={16} className="absolute top-4 end-6 text-white/70" />
        </div>

        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <p className="text-base leading-8" style={{ color: "var(--text-secondary)" }}>
            {t("about.p1")}
          </p>
          <p className="text-base leading-8" style={{ color: "var(--text-secondary)" }}>
            {t("about.p2")}
          </p>

          <ul className="flex flex-col gap-2.5">
            {[t("about.point1"), t("about.point2"), t("about.point3")].map((point) => (
              <li key={point} className="glass flex items-start gap-2.5 rounded-2xl px-4 py-3">
                <ShieldCheck size={17} className="mt-0.5 shrink-0" style={{ color: "var(--accent-1)" }} />
                <span className="text-sm leading-6 font-semibold" style={{ color: "var(--text-primary)" }}>{point}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {t("about.tagline")}
            </p>
            <Link
              to="/"
              className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(90deg, var(--accent-2), var(--accent-1))" }}
            >
              {t("errors.goHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
