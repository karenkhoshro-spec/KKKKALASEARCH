import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";
import { categories, promotedSubcategories } from "../data/categories";
import { getOtherSubcategoryCounts } from "../data/products";
import CategoryIconFrame from "./CategoryIconFrame";
import "./CategoryNav.css";

interface TileDescriptor {
  /** Route path when the tile links directly, else "other" modal trigger. */
  href?: string;
  id: string;
  label: string;
  other?: boolean;
}

/**
 * Desktop drag-to-scroll for a horizontal row. Touch devices already get
 * smooth native scrolling; this only adds mouse-drag support. The handler is
 * attached once per row, mutates scrollLeft directly (no rAF loops, no
 * smooth-scroll animations) and suppresses the click that would otherwise
 * fire after a real drag.
 */
function useDragToScroll() {
  const [dragging, setDragging] = useState(false);
  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
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
        setDragging(true);
      }
      if (moved) row.scrollLeft = startScroll - delta;
    };
    const onUp = (upEvent: PointerEvent) => {
      row.classList.remove("is-dragging");
      setDragging(false);
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
      void upEvent;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);
  return { dragging, onPointerDown };
}

function CategoryTile({ id, label, href, other = false }: { id: string; label: string; href?: string; other?: boolean }) {
  const className = `ks-category-tile${other ? " ks-category-tile-other" : ""}`;
  if (href) {
    return (
      <Link to={href} className={className} aria-label={label}>
        <CategoryIconFrame id={id} size={22} className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11" />
        <span className="ks-category-label">{label}</span>
      </Link>
    );
  }
  return (
    <a href="#all-categories" className={className} aria-label={label} onClick={(e) => e.preventDefault()}>
      <CategoryIconFrame id={id} size={22} className="h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11" />
      <span className="ks-category-label">{label}</span>
    </a>
  );
}

/**
 * Exactly TWO category rows. Row 1: primary categories. Row 2: the most
 * popular subcategories (promoted out of "سایر", data-driven ids matching
 * csvSource) — so more categories are visible without leaving the home page.
 * The final tile of row two is "سایر", which opens a modal listing EVERY
 * category (all primaries + all subcategories), each one selectable.
 * Both rows are horizontal, touch-swipeable strips (overflow-x auto + snap).
 */
function CategoryNav() {
  const { lang } = useLanguage();
  const [showAll, setShowAll] = useState(false);
  const rowDrag = useDragToScroll();
  const otherCategory = categories[categories.length - 1];

  const row1: TileDescriptor[] = categories.slice(0, 5).map((cat) => ({
    id: cat.id,
    label: cat.name[lang],
    href: `/category/${cat.id}`,
  }));
  const row2: TileDescriptor[] = [
    ...categories.slice(5, 8).map((cat) => ({ id: cat.id, label: cat.name[lang], href: `/category/${cat.id}` })),
    ...promotedSubcategories.map((sub) => ({ id: sub.id, label: sub.nameFa, href: `/category/other?sub=${sub.id}` })),
  ];
  if (otherCategory) row2.push({ id: otherCategory.id, label: otherCategory.name[lang], other: true });

  const allSubcategories = getOtherSubcategoryCounts();

  return (
    <nav className="ks-category-container" aria-label="دسته‌بندی‌های فروشگاه">
      {/* Row 1 — primary categories (same swipeable strip as row 2) */}
      <div className="ks-category-grid-4 ks-category-row-scroll" data-cat-row="1" onPointerDown={rowDrag.onPointerDown}>
        {row1.map((tile) => (
          <CategoryTile key={tile.id} id={tile.id} label={tile.label} href={tile.href} />
        ))}
      </div>

      {/* Row 2 — remaining primaries + popular subcategories + سایر (modal trigger) */}
      <div className="ks-category-grid-4 ks-category-row-other ks-category-row-scroll" data-cat-row="2" onPointerDown={rowDrag.onPointerDown}>
        {row2.map((tile, index) => (
          <CategoryTile key={`${tile.id}-${index}`} id={tile.id} label={tile.label} href={tile.href} other={tile.other} />
        ))}
      </div>

      {/* Full category list — opens when سایر is tapped */}
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
                    className="glass ks-category-tile flex-col rounded-2xl p-3 text-center"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <CategoryIconFrame id={cat.id} size={20} className="h-9 w-9" />
                    <span className="ks-category-label">{cat.name[lang]}</span>
                  </Link>
                ))}
            </div>

            <p className="mb-2 text-xs font-bold" style={{ color: "var(--text-muted)" }}>
              زیر دسته‌ها
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {allSubcategories.map((sub) => (
                <button
                  type="button"
                  key={sub.id}
                  onClick={() => setShowAll(false)}
                  className="glass ks-category-tile flex-col rounded-2xl p-3 text-center"
                  style={{ color: "var(--text-primary)" }}
                >
                  <CategoryIconFrame id={sub.id} size={20} className="h-9 w-9" />
                  <span className="ks-category-label">{sub.name[lang]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default CategoryNav;
