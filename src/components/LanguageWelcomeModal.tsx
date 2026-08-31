import { useState } from "react";
import { Globe2, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Lang } from "../types";
import Logo from "./Logo";
import { useOverlayBackClose } from "../utils/overlayHistory";

const LANG_OPTIONS: { code: Lang; labelKey: string; native: string }[] = [
  { code: "fa", labelKey: "welcome.fa", native: "فارسی" },
  { code: "en", labelKey: "welcome.en", native: "English" },
  { code: "ar", labelKey: "welcome.ar", native: "العربية" },
];

export default function LanguageWelcomeModal({ onDone }: { onDone: () => void }) {
  const { setLang, t, lang } = useLanguage();
  const [selected, setSelected] = useState<Lang>(lang);

  // Mobile back gesture closes the language overlay instead of leaving the site.
  useOverlayBackClose(true, onDone);

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
                onClick={() => setSelected(opt.code)}
                className={`flex flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-300 ${
                  selected === opt.code ? "scale-[1.03]" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  borderColor: selected === opt.code ? "var(--accent-1)" : "var(--border-soft)",
                  background: selected === opt.code ? "var(--chip-bg)" : "var(--surface)",
                  color: "var(--text-primary)",
                  boxShadow: selected === opt.code ? "var(--shadow-glow)" : "none",
                }}
              >
                {opt.native}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setLang(selected);
              onDone();
            }}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-transform duration-300 hover:scale-[1.02] active:scale-95"
            style={{ background: `linear-gradient(90deg, var(--accent-2), var(--accent-1))`, boxShadow: "var(--shadow-glow)" }}
          >
            <Sparkles size={16} />
            {t("welcome.cta")}
          </button>
        </div>
      </div>
    </div>
  );
}
