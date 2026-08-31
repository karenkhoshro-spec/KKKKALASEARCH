import { useLanguage } from "../i18n/LanguageContext";
import type { OrderStatus } from "../utils/api";

const PALETTE: Record<OrderStatus, string> = {
  registered: "var(--accent-1)",
  preparing: "#f59e0b",
  ready_pickup: "#06b6d4",
  shipping: "#8b5cf6",
  delivered: "var(--success)",
};

/** Crystal status chip — order status only (never payment status). */
export default function OrderStatusChip({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  const color = PALETTE[status] ?? "var(--text-secondary)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ background: "var(--chip-bg)", color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {t(`status.${status}`)}
    </span>
  );
}
