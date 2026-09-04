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

      {/* Full category list — opens when سایر is tapped (existing behavior). */}
      {showAll && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="همه دسته‌بندی‌ها"
          onClick={() => setShowAll(false)}
        >
          <div
            className="glass-strong max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-5"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1.5px solid var(--border-strong)", background: "var(--surface-strong)" }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                همه دسته‌بندی‌ها
              </h2>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="glass rounded-full px-3 py-1.5 text-xs font-bold active:scale-95"
                style={{ color: "var(--accent-1)", border: "1px solid var(--border-soft)" }}
              >
                بستن
              </button>
            </div>

            <p className="mb-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              دسته‌های اصلی
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categories
                .filter((c) => c.id !== "other")
                .map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    onClick={() => setShowAll(false)}
                    className="glass ks-category-card flex-col rounded-2xl p-3 text-center"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <CategoryIconFrame id={cat.id} size={20} className="h-9 w-9" />
                    <span className="ks-category-card-label">{cat.name[lang]}</span>
                  </Link>
                ))}
            </div>

            <p className="mb-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              زیر دسته‌ها
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {getOtherSubcategoryCounts().map((sub) => (
                <Link
                  key={sub.id}
                  to={`/category/other?sub=${sub.id}`}
                  onClick={() => setShowAll(false)}
                  className="glass ks-category-card flex-col rounded-2xl p-3 text-center"
                  style={{ color: "var(--text-primary)" }}
                >
                  <CategoryIconFrame id={sub.id} size={20} className="h-9 w-9" />
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
