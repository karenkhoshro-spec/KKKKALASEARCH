/**
 * OrderX brand wordmark — the site-wide identity.
 *
 * White wordmark ("Order" static + "X" with a subtle left/right sway) used in
 * the site header, footer and side menu. The animation is transform-only,
 * GPU-friendly, and respects prefers-reduced-motion.
 */
import "./OrderXLogo.css";

export default function OrderXLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`ks-orderx-logo${compact ? " ks-orderx-logo--compact" : ""} ${className}`.trim()}
      dir="ltr"
      aria-label="OrderX"
    >
      <span className="ks-orderx-word">Order</span>
      <span className="ks-orderx-x" aria-hidden="true">
        X
      </span>
    </span>
  );
}
