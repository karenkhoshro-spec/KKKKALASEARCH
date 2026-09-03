import { Link } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useAccount } from "../context/AccountContext";
import { fetchCustomerOrders, type StoredOrder } from "../utils/ordersApi";

export default function CustomerOrdersPanel() {
  const { t, lang } = useLanguage();
  const { account, orders } = useAccount();
  const [remote, setRemote] = useState<StoredOrder[]>([]);

  useEffect(() => {
    if (!account?.phone) {
      setRemote([]);
      return;
    }
    fetchCustomerOrders(account.phone)
      .then(setRemote)
      .catch(() => setRemote([]));
  }, [account?.phone]);

  const locale = lang === "fa" ? "fa-IR" : lang === "ar" ? "ar-EG" : "en-US";
  const rows = remote.length > 0
    ? remote.map((order) => ({
        orderNumber: order.orderNumber,
        date: order.createdAt,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
      }))
    : orders.map((order) => ({
        orderNumber: order.orderNumber,
        date: order.date,
        total: order.total,
        status: order.status,
        paymentStatus: undefined as string | undefined,
      }));

  return (
    <aside className="glass-strong rounded-2xl p-4" style={{ border: "1px solid var(--border-soft)" }}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-black" style={{ color: "var(--text-primary)" }}>
        <PackageSearch size={16} style={{ color: "var(--accent-1)" }} />
        <span>{t("cart.yourOrders")}</span>
      </h2>
      {!account?.phone ? (
        <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>
          {t("cart.loginToSeeOrders")}{" "}
          <Link to="/account" className="font-bold" style={{ color: "var(--accent-1)" }}>
            {t("account.loginTitle")}
          </Link>
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          {t("account.noOrders")}
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.orderNumber} className="rounded-xl px-3 py-2 text-xs" style={{ background: "var(--chip-bg)" }}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-black" style={{ color: "var(--text-primary)" }}>{row.orderNumber}</span>
                <span className="font-bold" style={{ color: "var(--accent-1)" }}>
                  {row.total.toLocaleString()} {t("cart.toman")}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2" style={{ color: "var(--text-muted)" }}>
                <span>{new Date(row.date).toLocaleString(locale)}</span>
                {row.status ? <span className="font-bold" style={{ color: "var(--accent-1)" }}>{t(`status.${row.status}`)}</span> : null}
              </div>
              {row.paymentStatus ? (
                <p className="mt-0.5 font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {t("checkout.paymentStatus")}: {t(`payment.${row.paymentStatus}`)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
