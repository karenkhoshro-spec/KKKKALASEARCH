import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  imageCandidatesToTry,
  markImageFailed,
  markImageLoaded,
  resolveMappedImageUrl,
} from "../data/productImageResolver";

/**
 * The one place that paints a mapped product asset at "small" sizes (cart line,
 * admin order line, customer order line).
 *
 * Rules the project must never break:
 *  - only the real mapped URL is requested — no generated/placeholder image;
 *  - the stored order keeps a bare file name (e.g. "4030.jpg"), so it has to go
 *    through the same relay chain as the catalog, otherwise the <img> resolves
 *    against the SPA route and shows a broken icon in Admin;
 *  - when nothing is reachable the card says so honestly.
 *
 * Fallback candidates are shared per asset through the resolver's session
 * memory, so ten order lines pointing at the same product cost one download.
 */
function ProductImage({
  src,
  alt,
  size = 160,
  eager = false,
  className = "",
  unavailableLabel,
  fallback,
}: {
  src?: string;
  alt: string;
  size?: number;
  eager?: boolean;
  className?: string;
  unavailableLabel?: string;
  /** shown when the product has no real mapping at all (e.g. inside order lines) */
  fallback?: ReactNode;
}) {
  const { t } = useLanguage();
  // the stored value may be a bare CSV file name; only a REAL mapping paints
  const real = resolveMappedImageUrl(src) ?? "";
  const [candidates, setCandidates] = useState(() => imageCandidatesToTry(real || undefined, size).candidates);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // a different asset (e.g. another variation) resets the walk
  const keyRef = useRef(real);
  if (keyRef.current !== real) {
    keyRef.current = real;
    const next = imageCandidatesToTry(real || undefined, size).candidates;
    if (next.length !== candidates.length || next[0]?.src !== candidates[0]?.src) {
      setCandidates(next);
      setAttempt(0);
      setLoaded(false);
    }
  }

  const entry = candidates[attempt];
  const current = entry?.src;
  const advance = () => {
    setLoaded(false);
    if (real && entry && attempt < candidates.length - 1) markImageFailed(real, size, entry.index);
    setAttempt((a) => Math.min(a + 1, candidates.length - 1));
  };

  // A hung request (firewalled origin) must not leave an empty box forever.
  useEffect(() => {
    if (!current || loaded || attempt >= candidates.length - 1) return;
    timerRef.current = setTimeout(advance, 6000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, loaded, attempt, candidates.length]);

  if (!real || candidates.length === 0) {
    if (fallback) {
      return <span className="flex h-full w-full items-center justify-center opacity-60">{fallback}</span>;
    }
    return (
      <span className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>
        {unavailableLabel ?? t("product.imageUnavailable")}
      </span>
    );
  }

  return (
    <img
      key={current}
      src={current}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      referrerPolicy="no-referrer"
      onLoad={(event) => {
        const el = event.currentTarget;
        if (el.naturalWidth > 0) {
          setLoaded(true);
          if (real && entry) markImageLoaded(real, size, entry.index);
        } else {
          advance();
        }
      }}
      onError={advance}
      className={`h-full w-full object-contain ${className}`}
    />
  );
}

export default memo(ProductImage);
