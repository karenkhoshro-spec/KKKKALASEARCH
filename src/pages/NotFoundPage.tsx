import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-28 text-center">
      <SearchX size={44} style={{ color: "var(--text-muted)" }} />
      <p style={{ color: "var(--text-primary)" }}>{t("errors.notFound")}</p>
      <Link to="/" className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: "var(--accent-1)" }}>
        {t("errors.goHome")}
      </Link>
    </div>
  );
}
