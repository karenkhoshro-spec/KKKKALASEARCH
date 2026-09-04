import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { readFileSync } from "node:fs";
import Home from "../src/pages/Home";
import SearchPage from "../src/pages/SearchPage";
import CategoryPage from "../src/pages/CategoryPage";
import { searchListableProducts } from "../src/data/products";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ListContextProvider } from "../src/context/ListContext";
import { AccountProvider } from "../src/context/AccountContext";
import { CartProvider } from "../src/context/CartContext";
import { ToastProvider } from "../src/context/ToastContext";
import { WishlistProvider } from "../src/context/WishlistContext";

function shell(node: React.ReactNode, path = "/") {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <ToastProvider>
          <AccountProvider>
            <WishlistProvider>
              <CartProvider>
                <ListContextProvider>{node}</ListContextProvider>
              </CartProvider>
            </WishlistProvider>
          </AccountProvider>
        </ToastProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

/** Every returned product name must genuinely relate to the query. */
function allNamesMatch(query: string, names: string[]) {
  return names.every((name) => name.includes(query));
}

describe("Search relevance (exact catalog terms only)", () => {
  it("returns only وان-related products for 'وان'", () => {
    const results = searchListableProducts("وان", "fa");
    expect(results.length).toBeGreaterThan(0);
    const names = results.map((p) => p.name.fa);
    expect(allNamesMatch("وان", names)).toBe(true);
    // No unrelated products leak in (آبکش/زنبیل etc.)
    expect(names.some((n) => n.includes("آبکش"))).toBe(false);
    expect(names.some((n) => n.includes("زنبیل"))).toBe(false);
  });

  it("returns only آبکش-related products for 'آبکش'", () => {
    const results = searchListableProducts("آبکش", "fa");
    expect(results.length).toBeGreaterThan(0);
    expect(allNamesMatch("آبکش", results.map((p) => p.name.fa))).toBe(true);
  });

  it("returns only زنبیل-related products for 'زنبیل'", () => {
    const results = searchListableProducts("زنبیل", "fa");
    expect(results.length).toBeGreaterThan(0);
    expect(allNamesMatch("زنبیل", results.map((p) => p.name.fa))).toBe(true);
    // Exact name matches rank first
    expect(results[0].name.fa.startsWith("زنبیل")).toBe(true);
  });

  it("ranks exact name matches before word-prefix matches", () => {
    const results = searchListableProducts("زنبیل سیب", "fa");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name.fa).toContain("زنبیل سیب");
  });
});

describe("Search result cards are name-only (match category browsing)", () => {
  it("renders search results as minimal name-only cards", () => {
    const html = shell(<SearchPage />, "/search?q=زنبیل");
    expect(html).toContain("ks-product-card");
    expect(html).toContain("is-minimal");
    expect(html).not.toContain("ks-product-image-wrapper");
    // No price rendered
    expect(html).not.toContain("تومان");
    // Cards still navigate to product details
    expect(html).toContain('href="/product/');
  });
});

describe("Home page compact quick search", () => {
  it("shows the quick search input with جستجوی سریع placeholder", () => {
    const html = shell(<Home />);
    expect(html).toContain("جستجوی سریع");
    expect(html).toContain('type="search"');
  });

  it("keeps name-only cards in the همه محصولات grid", () => {
    const html = shell(<Home />);
    expect(html).toContain("is-minimal");
    expect(html).not.toContain("کد محصول");
    expect(html).not.toContain("شناسه کالا");
  });

  it("searches directly against the same relevance engine", () => {
    const results = searchListableProducts("وان", "fa");
    expect(allNamesMatch("وان", results.map((p) => p.name.fa))).toBe(true);
  });
});

describe("Category slider: one compact horizontal swipe strip", () => {
  it("renders a single row slider with همه cards including سایر last", () => {
    const html = shell(<Home />);
    expect(html).toContain("ks-category-slider");
    // Exactly ONE slider row (old two-row layout removed)
    expect(html.match(/ks-category-slider/g)).toHaveLength(1);
    // سایر is the final card and opens the existing modal. All category
    // links precede it (it is a modal-trigger button, not a link).
    expect(html).toContain("ks-category-card--other");
    expect(html).toContain('aria-label="سایر"');
    const otherIdx = html.indexOf("ks-category-card--other");
    const lastLinkIdx = html.lastIndexOf('href="/category/');
    expect(otherIdx).toBeGreaterThan(lastLinkIdx);
  });

  it("defines compact native horizontal scrolling in CSS (no wrap, small gap)", () => {
    const css = readFileSync("src/components/CategoryNav.css", "utf8");
    expect(css).toContain("flex-wrap: nowrap");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).toContain("touch-action: pan-x");
    expect(css).toContain("-webkit-overflow-scrolling: touch");
    expect(css).toContain("overscroll-behavior-x: contain");
    expect(css).toMatch(/\.ks-category-card \{[^}]*flex: 0 0 auto;/s);
    expect(css).toMatch(/\.ks-category-card \{[^}]*scroll-snap-align: start;/s);
    // Small compact gap (8px target), never large spacing
    expect(css).toMatch(/gap: 8px/);
    // Compact card width range per spec (100–130px)
    expect(css).toMatch(/width: 104px/);
    expect(css).toMatch(/width: 130px/);
    // No old two-row classes remain
    expect(css).not.toContain("ks-category-grid-4");
    expect(css).not.toContain("ks-category-row-other");
  });

  it("keeps dark-mode neon purple card styling and light-mode clean cards", () => {
    const css = readFileSync("src/components/CategoryNav.css", "utf8");
    expect(css).toContain('html[data-theme="light"] .ks-category-card');
    expect(css).toContain("rgba(168, 85, 247"); // purple neon border/glow
  });
});

describe("Product code / item id removed from cards, present in details", () => {
  it("no card variant renders کد محصول or شناسه کالا", () => {
    const home = shell(<Home />);
    expect(home).not.toContain("کد محصول");
    expect(home).not.toContain("شناسه کالا");

    const category = shell(
      <Routes>
        <Route path="/category/:categoryId" element={<CategoryPage />} />
      </Routes>,
      "/category/shopping-basket",
    );
    expect(category).toContain("ks-product-card");
    expect(category).not.toContain("کد محصول");
    expect(category).not.toContain("شناسه کالا");
  });

  it("Product Details still shows کد محصول and شناسه کالا", () => {
    const css = readFileSync("src/pages/ProductDetails.tsx", "utf8");
    expect(css).toContain("کد محصول");
    expect(css).toContain("شناسه کالا");
  });
});

describe("Calculator '=' alignment", () => {
  it("centers key glyphs with flexbox (no asymmetric padding)", () => {
    const css = readFileSync("src/pages/Calculator.css", "utf8");
    const keyBlock = css.slice(css.indexOf(".ks-calc-key {"), css.indexOf("}", css.indexOf(".ks-calc-key {")));
    expect(keyBlock).toContain("display: flex");
    expect(keyBlock).toContain("align-items: center");
    expect(keyBlock).toContain("justify-content: center");
    expect(keyBlock).toContain("padding: 0");
    // Asymmetric horizontal padding that would off-center glyphs is gone
    expect(keyBlock).not.toMatch(/padding:\s*0\.9rem\s+\d/);
  });

  it("keeps the equals key in a single grid cell (no col-span)", () => {
    const page = readFileSync("src/pages/CalculatorPage.tsx", "utf8");
    const equalsLine = page.split("\n").find((l) => l.includes('"equals"'));
    expect(equalsLine).toBeTruthy();
    expect(equalsLine).toContain("false"); // wide = false → no col-span-2
  });
});
