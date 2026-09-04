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

describe("Category rows: both rows horizontally swipeable", () => {
  it("renders both rows with the shared scroll strip class", () => {
    const html = shell(<Home />);
    const row1 = html.indexOf('data-cat-row="1"');
    const row2 = html.indexOf('data-cat-row="2"');
    expect(row1).toBeGreaterThan(-1);
    expect(row2).toBeGreaterThan(row1);
    // Both rows share ks-category-row-scroll (overflow-x auto + snap + drag);
    // capture from each row's class attribute back to its opening "<div".
    const classStart1 = html.lastIndexOf("<div", row1);
    const row1Class = html.slice(classStart1, row1);
    const classStart2 = html.lastIndexOf("<div", row2);
    const row2Class = html.slice(classStart2, row2);
    expect(row1Class).toContain("ks-category-row-scroll");
    expect(row2Class).toContain("ks-category-row-scroll");
  });

  it("defines horizontal native scrolling + snap in CSS for both rows", () => {
    const css = readFileSync("src/components/CategoryNav.css", "utf8");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("scroll-snap-type: x proximity");
    expect(css).toContain("-webkit-overflow-scrolling: touch");
    // Row 1 and row 2 share the same scroll behavior rule
    expect(css).toMatch(/\.ks-category-grid-4,\s*\n\.ks-category-row-scroll \{/);
    // Identical tile min-widths on both rows
    expect(css).toMatch(/\.ks-category-row-other > \.ks-category-tile \{\s*\n\s*min-width: 22%;/);
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
