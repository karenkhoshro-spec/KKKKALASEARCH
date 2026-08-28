import { useState, useRef, useEffect } from "react";
import { Globe2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Lang } from "../types";

const OPTIONS: { code: Lang; native: string }[] = [
  { code: "fa", native: "فارسی" },
  { code: "en", native: "English" },
  { code: "ar", native: "العربية" },
];

export default function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "menu" }) {
  const { lang, setLang, t } = useLanguage();
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
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => setLang(opt.code)}
            className="rounded-xl border px-3 py-2 text-xs font-semibold transition-colors"
            style={{
              borderColor: lang === opt.code ? "var(--accent-1)" : "var(--border-soft)",
              background: lang === opt.code ? "var(--chip-bg)" : "transparent",
              color: "var(--text-primary)",
            }}
          >
            {opt.native}
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
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10"
        style={{ color: "var(--text-primary)" }}
      >
        <Globe2 size={19} />
      </button>
      {open && (
        <div
          className="glass-strong animate-pop fixed end-3 top-14 z-[240] min-w-[130px] overflow-hidden rounded-2xl p-1.5 sm:absolute sm:end-0 sm:top-11"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                setLang(opt.code);
                setOpen(false);
              }}
              className="block w-full rounded-xl px-3 py-2 text-start text-sm transition-colors hover:bg-white/10"
              style={{
                color: lang === opt.code ? "var(--accent-1)" : "var(--text-primary)",
                fontWeight: lang === opt.code ? 700 : 500,
              }}
            >
              {opt.native}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
