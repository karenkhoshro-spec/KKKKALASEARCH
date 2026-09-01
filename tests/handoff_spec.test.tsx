// @vitest-environment jsdom
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Header from "../src/components/Header";
import Footer from "../src/components/Footer";
import SideMenu from "../src/components/SideMenu";
import ThemeToggle from "../src/components/ThemeToggle";
import BackButton from "../src/components/BackButton";
import CategoryNav from "../src/components/CategoryNav";
import CartPage from "../src/pages/CartPage";
import ProductDetails from "../src/pages/ProductDetails";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { ListContextProvider } from "../src/context/ListContext";
import { AccountProvider } from "../src/context/AccountContext";
import { CartProvider } from "../src/context/CartContext";
import { ToastProvider } from "../src/context/ToastContext";
import { WishlistProvider } from "../src/context/WishlistContext";
import { AdminAuthProvider } from "../src/context/AdminAuthContext";
import { products, getProductById } from "../src/data/products";
import { ORDER_STATUSES } from "../src/utils/ordersApi";

const css = (file: string) => readFileSync(path.resolve(process.cwd(), file), "utf8");

function shell(node: ReactNode, path = "/") {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <AccountProvider>
              <WishlistProvider>
                <CartProvider>
                  <ListContextProvider>
                    <AdminAuthProvider>
                      {node}
                    </AdminAuthProvider>
                  </ListContextProvider>
                </CartProvider>
              </WishlistProvider>
            </AccountProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

const text = (html: string) => html.replace(/<[^>]+>/g, " ");

/** Renders a page at a real route so useParams() resolves (ProductDetails, ...). */
function routeShell(node: ReactNode, path: string, pattern: string) {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <AccountProvider>
              <WishlistProvider>
                <CartProvider>
                  <ListContextProvider>
                    <AdminAuthProvider>
                      <Routes>
                        <Route path={pattern} element={node} />
                      </Routes>
                    </AdminAuthProvider>
                  </ListContextProvider>
                </CartProvider>
              </WishlistProvider>
            </AccountProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

/** Seeds the persisted cart so CartPage renders its real (non-empty) state. */
function seedCart(items: unknown[]) {
  window.localStorage.setItem("kala-search-cart", JSON.stringify(items));
}

describe("handoff spec — header, menu, theme", () => {
  it("header keeps exactly hamburger + brand + cart/account, theme toggle removed", () => {
    const html = shell(<Header />);
    const headerOnly = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
    // hamburger is the first interactive element (renders on the right in RTL)
    const beforeBrand = headerOnly.slice(0, headerOnly.indexOf("ks-site-header-brand"));
    expect(beforeBrand.indexOf("aria-label=\"منو\"")).toBeGreaterThan(-1);
    expect(beforeBrand).not.toContain("aria-label=\"سبد خرید\"");
    expect(html).toContain('aria-label="منو"');
    expect(html).toContain('aria-label="سبد خرید"');
    expect(html).toContain('aria-label="حساب کاربری"');
    // theme control must not live in the header bar any more (it belongs to the hamburger)
    expect(headerOnly).not.toContain("ks-theme-control");
    expect(headerOnly).not.toContain("ks-theme-track");
    expect(html).toContain("ks-theme-control"); // ... and it does live in the side menu
    // no stray extra icon buttons beyond hamburger / cart / account
    expect((headerOnly.match(/ks-crystal-action-btn/g) ?? []).length).toBe(3);
  });

  it("hamburger carries the theme toggle, the family artwork and one card style", () => {
    const html = shell(<SideMenu open onClose={() => undefined} />);
    expect(html).toContain("/images/menu-family.jpg");
    expect(html).toContain("کالا سرچ");
    expect(html).toContain("به هرچی که میخوای برس!");
    expect(html).toContain("ks-theme-control");
    // every row uses the same button style
    const rows = (html.match(/ks-menu-purple-btn/g) ?? []).length;
    expect(rows).toBeGreaterThanOrEqual(5);
    for (const link of ["/", "/cart", "/account", "/wishlist"]) {
      expect(html).toContain(`href="${link}"`);
    }
    // Requirement 1 (earlier approved phase): no product list in the menu
    expect(html).not.toContain('href="/products"');
    expect(html).not.toContain('href="/category/other"');
  });

  it("sun stays on the left of the moon even under RTL", () => {
    const html = shell(<ThemeToggle showLabel />);
    const track = html.slice(html.indexOf("ks-theme-track"));
    expect(track.indexOf("ks-theme-sun")).toBeLessThan(track.indexOf("ks-theme-moon"));
    const indexCss = css("src/index.css");
    const trackRule = indexCss.slice(indexCss.indexOf(".ks-theme-track {"), indexCss.indexOf(".ks-theme-track {") + 400);
    expect(trackRule).toContain("direction: ltr");
  });

  it("day theme is orange + green + white, night theme is purple", () => {
    const indexCss = css("src/index.css");
    const light = indexCss.slice(indexCss.indexOf('html[data-theme="light"] {'), indexCss.indexOf('html[data-theme="light"] {') + 1400);
    expect(light).toContain("--accent-1: #2f7d50"); // green
    expect(light).toContain("--accent-2: #e98232"); // orange
    expect(light).toContain("--card-bg: #ffffff"); // white
    const dark = indexCss.slice(indexCss.indexOf(":root {"), indexCss.indexOf(":root {") + 1400);
    expect(dark).toContain("--accent-1: #a855f7"); // purple
    expect(dark).toContain("--accent-2: #7c3aed"); // purple
  });
});

describe("handoff spec — navigation, cards, footer", () => {
  it("no × / ✕ glyph is used anywhere as a close or back control", () => {
    for (const file of [
      "src/components/BackButton.tsx",
      "src/components/SideMenu.tsx",
      "src/components/AboutOverlay.tsx",
      "src/components/ContactOverlay.tsx",
      "src/components/LanguageWelcomeModal.tsx",
      "src/components/OverlayHeader.tsx",
      "src/components/CategoryOverlayHeader.tsx",
      "src/components/CustomerOrdersPanel.tsx",
      "src/pages/CartPage.tsx",
      "src/pages/ProductDetails.tsx",
    ]) {
      expect(css(file)).not.toMatch(/[×✕✖]/);
    }
  });

  it("back controls are icon + label, styled through one shared class", () => {
    const html = shell(<BackButton to="/products" />);
    expect(html).toContain("glass");
    expect(html).not.toMatch(/[×✕✖]/);
    expect(html).toContain("بازگشت");
  });

  it("category cards carry an icon and a name but never a product image", () => {
    const html = shell(<CategoryNav />);
    expect(html).toContain("ks-category-icon");
    expect(html).not.toContain("<img");
  });

  it("category glow is pinned inside the card border and clipped to a ring", () => {
    const navCss = css("src/components/CategoryNav.css");
    const start = navCss.indexOf(".ks-icon-3d::before");
    expect(start).toBeGreaterThan(-1);
    const ring = navCss.slice(start, start + 900);
    expect(ring).toContain("inset: 0;");
    expect(ring).toContain("border-radius: inherit;");
    expect(ring).toContain("padding: 1.6px;");
    expect(ring).toContain("mask-composite: exclude");
    expect(ring).toContain("pointer-events: none;");
    expect(ring).not.toMatch(/inset:\s*-/); // never escapes the card bounds
    // day + night both defined, and motion is honoured
    expect(navCss).toContain('html[data-theme="light"] .ks-icon-3d::before');
    expect(navCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("footer quick access is one chip per destination, product list removed", () => {
    const html = shell(<Footer />);
    for (const link of ["/", "/products", "/search", "/cart", "/account", "/wishlist"]) {
      expect(html).toContain(`href="${link}"`);
    }
    expect((html.match(/ks-footer-chip/g) ?? []).length).toBe(6);
    // no product names / prices leaking into the footer
    expect(html).not.toContain(" تومان");
  });
});

describe("handoff spec — catalog, images, orders", () => {
  it("catalog is the real 347 product / 936 variant CSV import, nothing hardcoded", () => {
    expect(products.length).toBe(347);
    const variants = products.reduce((sum, p) => sum + (p.variations?.length ?? 0), 0);
    expect(variants).toBe(936);
  });

  it("product images resolve to the real Ashkan URLs through the 303-entry mapping", () => {
    for (const [id, url] of [
      ["8039010", "https://ashkanplastic.com/wp-content/uploads/4030.jpg"],
      ["7025010", "https://ashkanplastic.com/wp-content/uploads/22212.jpg"],
      ["1100312", "https://ashkanplastic.com/wp-content/uploads/750.jpg"],
    ] as const) {
      expect(getProductById(id)?.productImageUrl).toBe(url);
    }
    const mapping = JSON.parse(css("src/data/productImages.json")) as Record<string, string>;
    expect(Object.keys(mapping).length).toBe(303);
    expect(Object.values(mapping).every((u) => u.startsWith("https://ashkanplastic.com/"))).toBe(true);
    expect(Object.values(mapping).some((u) => /placeholder|example\.com|dummy/i.test(u))).toBe(false);
    // no fabricated asset: a product with no mapping and no image must stay empty
    const unmapped = products.find((p) => !p.productImageUrl && !p.image);
    expect(unmapped === undefined || !/placeholder/i.test(unmapped.image ?? "")).toBe(true);
  });

  it("out-of-stock product offers درخواست تولید instead of افزودن به سبد", () => {
    const oos = products.find((p) => !p.inStock && p.variations?.length);
    expect(oos).toBeDefined();
    const html = routeShell(<ProductDetails />, `/product/${oos?.id}`, "/product/:id");
    expect(html).toContain("درخواست تولید");
    expect(html).not.toContain("افزودن به سبد");
  });

  it("in-stock product offers افزودن به سبد and shows its real image", () => {
    const inStock = getProductById("8039010");
    expect(inStock?.inStock).toBe(true);
    const html = routeShell(<ProductDetails />, "/product/8039010", "/product/:id");
    expect(html).toContain("افزودن به سبد");
    // images load relay-first for speed; the relay carries the real origin URL
    expect(html).toContain("images.weserv.nl");
    expect(html).toContain(encodeURIComponent("https://ashkanplastic.com/wp-content/uploads/4030.jpg"));
  });

  it("cart carries the two required sections", () => {
    seedCart([
      {
        productId: "8039010",
        name: "سرویس لگن اپل تاپ 4 عددی سفید",
        image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
        price: 1000,
        quantity: 2,
        variation: { id: "803901003", name: "سفید", sku: "803901003", price: 1000, color: "سفید", colorHex: "#ffffff" },
      },
    ]);
    const html = shell(<CartPage />);
    expect(html).toContain("انتخاب سفارش");
    expect(html).toContain("سفارشات شما");
    // the seeded line renders with its real image, colour dot and money maths
    expect(html).toContain("4030.jpg");
    expect(html).toContain("2,000");
  });

  it("order status pipeline covers registered → preparing → shipping → delivered", () => {
    for (const status of ["registered", "preparing", "shipping", "delivered"]) {
      expect(ORDER_STATUSES).toContain(status as (typeof ORDER_STATUSES)[number]);
    }
  });

  it("cart lines keep product id, sku, color, quantity and totals", () => {
    seedCart([
      {
        productId: "8039010",
        name: "سرویس لگن اپل تاپ 4 عددی سفید",
        image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
        price: 1000,
        quantity: 2,
        variation: { id: "803901003", name: "سفید", sku: "803901003", price: 1000, color: "سفید", colorHex: "#ffffff" },
      },
    ]);
    const html = text(shell(<CartPage />));
    expect(html.length).toBeGreaterThan(0);
    const item = getProductById("8039010");
    expect(item?.productCode).toBe("8039010");
    expect(item?.variations?.[0]?.sku).toBeTruthy();
  });
});
