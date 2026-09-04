import { useLanguage } from "../i18n/LanguageContext";
import type { Lang } from "../types";
import OrderXLogo from "./OrderXLogo";
import { useUiLayer } from "../context/UiLayerContext";
import "./LanguageWelcomeModal.css";

const LANG_OPTIONS: { code: Lang; native: string }[] = [
  { code: "fa", native: "فارسی" },
  { code: "en", native: "English" },
  { code: "ar", native: "العربية" },
];

export default function LanguageWelcomeModal({ onDone }: { onDone: () => void }) {
  const { setLang, t, lang } = useLanguage();
  useUiLayer(true, onDone);

  return (
    <div className="ks-welcome-scrim fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto px-4 py-10 sm:items-center">
      <div className="ks-welcome-card animate-pop relative w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-3 flex items-center justify-center overflow-visible">
            <div className="flex items-center justify-center rounded-2xl px-5 py-3" style={{ background: "var(--accent-1)" }}>
              <OrderXLogo />
            </div>
          </div>

          <h2 className="mt-2 text-xl font-bold" style={{ color: "var(--text-primary)" }}>
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
                className={`ks-welcome-lang rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-300 ${
                  lang === opt.code ? "scale-[1.03]" : "opacity-90 hover:opacity-100"
                }`}
                style={{
                  borderColor: lang === opt.code ? "var(--accent-1)" : "var(--border-soft)",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                }}
              >
                <span>{opt.native}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
