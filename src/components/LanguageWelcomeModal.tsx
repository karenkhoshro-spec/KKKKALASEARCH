import { Globe2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Lang } from "../types";
import Logo from "./Logo";

const LANG_OPTIONS: { code: Lang; labelKey: string; native: string }[] = [
  { code: "fa", labelKey: "welcome.fa", native: "فارسی" },
  { code: "en", labelKey: "welcome.en", native: "English" },
  { code: "ar", labelKey: "welcome.ar", native: "العربية" },
];

export default function LanguageWelcomeModal({ onDone }: { onDone: () => void }) {
  const { setLang, t, lang } = useLanguage();

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-sm sm:items-center">
      <div className="animate-pop glass-strong relative w-full max-w-md overflow-hidden rounded-3xl p-6 shadow-[var(--shadow-glow)] sm:p-8">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-40 animate-glow-pulse" style={{ background: "var(--accent-1)" }} />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full opacity-30 animate-glow-pulse" style={{ background: "var(--accent-3)" }} />

        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--chip-bg)" }}>
            <Globe2 size={28} style={{ color: "var(--accent-1)" }} />
          </div>
          <div className="mb-1 scale-110"><Logo /></div>
          <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t("welcome.title")}
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {t("welcome.subtitle")}
          </p>

          <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={() => {
                  setLang(opt.code);
                  onDone();
                }}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-300 ${
                  lang === opt.code ? "scale-[1.03]" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  borderColor: lang === opt.code ? "var(--accent-1)" : "var(--border-soft)",
                  background: lang === opt.code ? "var(--chip-bg)" : "var(--surface)",
                  color: "var(--text-primary)",
                  boxShadow: lang === opt.code ? "var(--shadow-glow)" : "none",
                }}
              >
                {opt.native}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
