import { useState, useRef, useEffect } from "react";
import { Check, Globe2, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Lang } from "../types";

const OPTIONS: { code: Lang; native: string; flag: string }[] = [
  { code: "fa", native: "فارسی", flag: "🇮🇷" },
  { code: "en", native: "English", flag: "🇬🇧" },
  { code: "ar", native: "العربية", flag: "🇸🇦" },
];

export default function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "menu" }) {
  const { lang, dir, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (variant === "menu") {
    return (
      <div className="flex flex-wrap gap-2" dir={dir}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setLang(opt.code)}
            className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
            style={{
              borderColor: lang === opt.code ? "var(--accent-1)" : "var(--border-soft)",
              background: lang === opt.code ? "var(--chip-bg)" : "transparent",
              color: "var(--text-primary)",
            }}
          >
            <span className="text-lg leading-none" aria-hidden="true">{opt.flag}</span>
            <span>{opt.native}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={t("header.language")}
        aria-label={t("header.language")}
        aria-expanded={open}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${open ? "rotate-12 scale-110" : "hover:scale-110"}`}
        style={{ color: "var(--text-primary)" }}
      >
        <span
          className="absolute inset-0 rounded-full opacity-0 blur-md transition-opacity duration-300"
          style={{ background: "var(--accent-1)", opacity: open ? 0.45 : 0 }}
        />
        <Globe2 size={20} className="relative" />
      </button>
      {open && (
        <div
          dir={dir}
          className="fixed end-3 top-14 z-[240] w-[calc(100vw-24px)] max-w-[240px] animate-pop rounded-2xl p-[1px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:absolute sm:end-0 sm:top-11 sm:w-[240px]"
          style={{ insetInlineEnd: "max(12px, env(safe-area-inset-right))" }}
        >
          <div
            className="overflow-hidden rounded-[15px] border p-2"
            style={{
              background: "var(--dropdown-bg)",
              borderColor: "var(--border-strong)",
              backdropFilter: "blur(32px) saturate(180%)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)",
            }}
          >
            <div className="mb-1.5 flex items-center gap-2 px-2.5 py-1" style={{ color: "var(--text-secondary)" }}>
              <Sparkles size={14} style={{ color: "var(--accent-1)" }} />
              <span className="text-xs font-bold">{t("header.language")}</span>
            </div>
            <div className="flex flex-col gap-1">
              {OPTIONS.map((opt) => {
                const active = lang === opt.code;
                return (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setLang(opt.code);
                      setOpen(false);
                    }}
                    className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start transition-all duration-200 hover:bg-white/10"
                    style={{
                      color: active ? "var(--accent-1)" : "var(--text-primary)",
                      background: active ? "var(--surface-strong)" : "transparent",
                      fontWeight: active ? 700 : 500,
                    }}
                  >
                    <span className="text-xl leading-none" aria-hidden="true">{opt.flag}</span>
                    <span className="flex-1 text-sm">{opt.native}</span>
                    {active && <Check size={16} style={{ color: "var(--accent-1)" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
