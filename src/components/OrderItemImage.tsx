import { useEffect, useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { orderItemImageChain } from "../utils/orderItemImage";
import type { OrderItemPayload } from "../utils/ordersApi";

/**
 * Product thumbnail inside admin order items.
 * Loads the REAL product image through the app-wide chain
 * (relay CDN → real site → relay CDN). Only when every real candidate fails
 * does it show the explicit "تصویر موجود نیست" state — never a blank box.
 */
export default function OrderItemImage({ item }: { item: OrderItemPayload }) {
  const { t } = useLanguage();
  const chain = useMemo(
    () => orderItemImageChain(item),
    // item.image changes identity on refetch; only rebuild when real values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [item.productId, item.productCode, item.image, item.sku],
  );
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = attempt < chain.length ? chain[attempt] : undefined;

  const advanceAttempt = () => {
    setLoaded(false);
    setAttempt((a) => a + 1);
  };

  // Safety net: if a candidate hangs (no error event), move to the next one.
  useEffect(() => {
    if (!src || loaded || attempt >= chain.length) return;
    const timer = setTimeout(advanceAttempt, 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, loaded, chain.length]);

  const markLoaded = (el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0) setLoaded(true);
  };

  if (!src) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center">
        <PackageSearch size={16} style={{ color: "var(--text-muted)" }} />
        <span className="text-[9px] font-semibold leading-3" style={{ color: "var(--text-muted)" }}>
          {t("product.imageUnavailable")}
        </span>
      </div>
    );
  }

  return (
    <img
      key={src}
      ref={markLoaded}
      src={src}
      alt={item.name || item.model || ""}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="h-full w-full object-contain"
      onLoad={() => setLoaded(true)}
      onError={advanceAttempt}
    />
  );
}
