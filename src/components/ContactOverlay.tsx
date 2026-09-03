import { Phone } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useUiLayer } from "../context/UiLayerContext";
import { CONTACT_NUMBERS } from "../data/contact";

export default function ContactOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, dir } = useLanguage();
  useUiLayer(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir={dir}>
      <div className="fixed inset-0 bg-black/65 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <div
        className="glass-strong relative z-10 w-full max-w-sm rounded-3xl p-5 shadow-2xl animate-pop"
        style={{ borderColor: "var(--border-strong)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-overlay-title"
      >
        <h2 id="contact-overlay-title" className="mb-4 text-center text-sm font-black" style={{ color: "var(--text-primary)" }}>
          {t("menu.contact")}
        </h2>
        <div className="flex flex-col gap-2.5">
          {CONTACT_NUMBERS.map((number) => (
            <a
              key={number.display}
              href={number.href}
              dir="ltr"
              className="glass flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold"
              style={{ color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
            >
              <Phone size={16} />
              <span>{number.display}</span>
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-2xl py-2.5 text-xs font-bold"
          style={{ color: "var(--text-secondary)" }}
        >
          {t("category.back")}
        </button>
      </div>
    </div>
  );
}
