import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { categories } from "../data/categories";
import { getOtherSubcategoryCounts } from "../data/products";
import CategoryIconFrame from "./CategoryIconFrame";
import "./CategoryNav.css";

/**
 * Single compact horizontal category slider (one row, no wrapping).
 * - Native overflow-x scrolling: smooth on touch (touch-action: pan-x), no JS
 *   slider library, no autoplay, no pagination dots.
 * - Mouse drag-to-scroll for desktop (single passive pointer handler; the
 *   click that follows a real drag is swallowed so tiles don't navigate).
 * - The final tile is always "سایر" (last category in the data), which opens
 *   the existing full-category modal — category navigation is unchanged.
 */
function CategoryNav() {
  const { lang } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const otherCategory = categories[categories.length - 1];

  /** Desktop drag-to-scroll (touch devices already scroll natively). */
  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    const row = event.currentTarget;
    const startX = event.clientX;
    const startScroll = row.scrollLeft;
    let moved = false;
    const onMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX;
      if (!moved && Math.abs(delta) > 6) {
        moved = true;
        row.classList.add("is-dragging");
      }
      if (moved) row.scrollLeft = startScroll - delta;
    };
    const onUp = () => {
      row.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (moved) {
        // Swallow the click that follows a drag so tiles don't navigate.
        const swallow = (clickEvent: MouseEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
        };
        row.addEventListener("click", swallow, { capture: true, once: true });
        window.setTimeout(() => row.removeEventListener("click", swallow, { capture: true }), 80);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  return (
    <nav className="ks-category-nav" aria-label="دسته‌بندی‌های فروشگاه">
      {/* ONE single horizontal strip — every primary category, سایر last. */}
      <div
        className="ks-category-slider"
        data-cat-row="1"
        onPointerDown={onPointerDown}
      >
        {categories.map((cat) => {
          const isOther = cat.id === otherCategory?.id;
          if (isOther) {
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setShowAll(true)}
                className="ks-category-card ks-category-card--other"
                aria-label={cat.name[lang]}
                aria-haspopup="dialog"
              >
                <span className="ks-category-card-icon">
                  <CategoryIconFrame id={cat.id} size={26} className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <span className="ks-category-card-label">{cat.name[lang]}</span>
              </button>
            );
          }
          return (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="ks-category-card"
              aria-label={cat.name[lang]}
            >
              <span className="ks-category-card-icon">
                <CategoryIconFrame id={cat.id} size={26} className="h-6 w-6 sm:h-7 sm:w-7" />
              </span>
              <span className="ks-category-card-label">{cat.name[lang]}</span>
            </Link>
          );
        })}
      </div>

      {/* Full category list — opens when سایر is tapped (existing behavior).
          Compact: sized to content, small gaps, mobile-first padding. */}
      {showAll && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-2 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="همه دسته‌بندی‌ها"
          onClick={() => setShowAll(false)}
        >
          <div
            className="ks-category-modal glass-strong max-h-[78vh] w-fit min-w-[min(92vw,20rem)] max-w-[92vw] overflow-y-auto rounded-2xl p-3.5 sm:max-w-xl sm:p-4"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1.5px solid var(--border-strong)", background: "var(--surface-strong)" }}
          >
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black sm:text-base" style={{ color: "var(--text-primary)" }}>
                همه دسته‌بندی‌ها
              </h2>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="glass rounded-full px-2.5 py-1 text-[11px] font-bold active:scale-95 sm:text-xs"
                style={{ color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
              >
                بستن
              </button>
            </div>

            <p className="mb-1.5 text-[10px] font-bold sm:text-xs" style={{ color: "var(--text-muted)" }}>
              دسته‌های اصلی
            </p>
            <div className="ks-modal-grid mb-2.5">
              {categories
                .filter((c) => c.id !== "other")
                .map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    onClick={() => setShowAll(false)}
                    className="glass ks-modal-card ks-category-card flex-col text-center"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span className="ks-category-card-icon ks-category-card-icon--sm">
                      <CategoryIconFrame id={cat.id} size={18} className="h-5 w-5" />
                    </span>
                    <span className="ks-category-card-label">{cat.name[lang]}</span>
                  </Link>
                ))}
            </div>

            <p className="mb-1.5 text-[10px] font-bold sm:text-xs" style={{ color: "var(--text-muted)" }}>
              زیر دسته‌ها
            </p>
            <div className="ks-modal-grid">
              {getOtherSubcategoryCounts().map((sub) => (
                <Link
                  key={sub.id}
                  to={`/category/other?sub=${sub.id}`}
                  onClick={() => setShowAll(false)}
                  className="glass ks-modal-card ks-category-card flex-col text-center"
                  style={{ color: "var(--text-primary)" }}
                >
                  <span className="ks-category-card-icon ks-category-card-icon--sm">
                    <CategoryIconFrame id={sub.id} size={18} className="h-5 w-5" />
                  </span>
                  <span className="ks-category-card-label">{sub.name[lang]}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default CategoryNav;
