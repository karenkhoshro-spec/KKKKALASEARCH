import { useState, useRef, useEffect } from "react";
import { Check, Globe2, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Lang } from "../types";

const OPTIONS: { code: Lang; native: string; flag: string; short: string; glow: string }[] = [
  { code: "fa", native: "فارسی", flag: "🇮🇷", short: "فا", glow: "#a855f7" },
  { code: "en", native: "English", flag: "🇬🇧", short: "EN", glow: "#22d3ee" },
  { code: "ar", native: "العربية", flag: "🇸🇦", short: "ع", glow: "#ec4899" },
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
          <button key={opt.code} onClick={() => setLang(opt.code)} className="rounded-xl border px-3 py-2 text-xs font-semibold transition-colors" style={{ borderColor: lang === opt.code ? opt.glow : "var(--border-soft)", background: lang === opt.code ? "var(--chip-bg)" : "transparent", color: "var(--text-primary)" }}>
            <span className="text-lg leading-none" aria-hidden="true">{opt.flag}</span>
            <span>{opt.native}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} title={t("header.language")} aria-label={t("header.language")} aria-expanded={open} className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${open ? "rotate-12 scale-110" : "hover:scale-110"}`} style={{ color: "var(--text-primary)" }}>
        <span className="absolute inset-0 rounded-full opacity-0 blur-md transition-opacity duration-300" style={{ background: "var(--accent-1)", opacity: open ? 0.45 : 0 }} />
        <Globe2 size={20} className="relative" />
      </button>
      {open && (
        <div dir={dir} className="fixed end-3 top-14 z-[240] w-[min(268px,calc(100vw-24px))] animate-pop rounded-3xl p-[1px] shadow-[0_16px_50px_rgba(0,0,0,0.35)] sm:absolute sm:end-0 sm:top-11">
          <div className="glass-strong overflow-hidden rounded-[23px] p-2.5" style={{ background: "linear-gradient(145deg, color-mix(in srgb, var(--accent-1) 18%, var(--surface-strong)), var(--surface-strong))" }}>
            <div className="mb-2 flex items-center gap-2 px-2 py-1" style={{ color: "var(--text-secondary)" }}>
              <Sparkles size={15} style={{ color: "var(--accent-1)" }} />
              <span className="text-xs font-bold">{t("header.language")}</span>
            </div>
            <div className="flex flex-col gap-1">
              {OPTIONS.map((opt) => {
                const active = lang === opt.code;
                return (
                  <button key={opt.code} onClick={() => { setLang(opt.code); setOpen(false); }} className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10" style={{ color: active ? opt.glow : "var(--text-primary)", background: active ? "var(--chip-bg)" : "transparent", boxShadow: active ? `0 0 22px ${opt.glow}33` : "none" }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl leading-none shadow-lg transition-transform duration-300 group-hover:rotate-6" style={{ background: `linear-gradient(135deg, ${opt.glow}, var(--accent-2))` }} aria-hidden="true">{opt.flag}</span>
                    <span className="flex-1 text-sm font-semibold">{opt.native}</span>
                    {active && <Check size={17} />}
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
