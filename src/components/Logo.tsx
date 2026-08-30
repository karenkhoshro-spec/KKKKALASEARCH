import { Atom, Search } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export default function Logo({ compact = false }: { compact?: boolean }) {
  const { lang } = useLanguage();
  const brandFa = "کالا سرچ";

  return (
    <div className="flex select-none items-center gap-2" style={{ color: "var(--text-primary)" }}>
      <span className="relative flex h-8 w-8 items-center justify-center shrink-0">
        <span
          className="absolute inset-0 rounded-full blur-md opacity-70"
          style={{ background: "radial-gradient(circle, var(--accent-1), transparent 70%)" }}
        />
        <Atom size={compact ? 22 : 26} className="relative animate-spin-slow" style={{ color: "var(--accent-1)" }} strokeWidth={1.8} />
      </span>
      <span className={`flex items-baseline gap-1.5 font-extrabold tracking-tight ${compact ? "text-base" : "text-lg sm:text-xl"}`}>
        {lang === "fa" ? (
          <span className="ks-brand-wordmark">{brandFa}</span>
        ) : (
          <>
            <span className="ks-brand-wordmark">KALA</span>
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
              {lang === "ar" ? "سيرش" : "SEARCH"}
            </span>
          </>
        )}
      </span>
      <Search size={compact ? 15 : 17} className="shrink-0" style={{ color: "var(--accent-1)" }} strokeWidth={2.5} />
    </div>
  );
}
