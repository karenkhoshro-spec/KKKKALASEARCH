import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Header from "../src/components/Header";
import Footer from "../src/components/Footer";
import SideMenu from "../src/components/SideMenu";
import ThemeToggle from "../src/components/ThemeToggle";
import OverlayHeader from "../src/components/OverlayHeader";
import CategoryPage from "../src/pages/CategoryPage";
import CartPage from "../src/pages/CartPage";
import AccountPage from "../src/pages/AccountPage";
import AdminLoginPage from "../src/pages/admin/AdminLoginPage";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { ListContextProvider } from "../src/context/ListContext";
import { AccountProvider } from "../src/context/AccountContext";
import { CartProvider } from "../src/context/CartContext";
import { ToastProvider } from "../src/context/ToastContext";
import { WishlistProvider } from "../src/context/WishlistContext";
import { AdminAuthProvider } from "../src/context/AdminAuthContext";
import { qtyForVariation, setQtyForVariation } from "../src/utils/variationQuantity";

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

describe("17-item UI polish", () => {
  it("keeps color quantity isolated per variation", () => {
    let map: Record<string, number> = {};
    map = setQtyForVariation(map, "white", 2);
    expect(qtyForVariation(map, "red")).toBe(0);
    map = setQtyForVariation(map, "red", 1);
    expect(qtyForVariation(map, "white")).toBe(2);
    expect(qtyForVariation(map, "red")).toBe(1);
  });

  it("renders header OrderX branding (X-only sway) instead of old KalaSearch assets", () => {
    const html = shell(<Header />);
    // The site-wide brand is OrderX: static "Order", animated "X".
    expect(html).toContain("ks-orderx-logo");
    expect(html).toContain("ks-orderx-word");
    expect(html).toContain("ks-orderx-x");
    expect(html).toContain('aria-label="OrderX"');
    // No old KalaSearch logo assets or wordmarks in the header.
    expect(html).not.toContain("kalasearch-bag");
    expect(html).not.toContain("کالا سرچ");
    expect(html).not.toContain("KalaSearch");
  });

  it("keeps theme toggle only in the hamburger menu as a clear sun/moon segmented control", () => {
    const header = shell(<Header />);
    expect(header).toContain("ks-site-header");
    // Theme toggle must NOT be in the header bar anymore (Req 7) — check the
    // header bar region only, since Header internally renders the closed SideMenu.
    const barStart = header.indexOf("ks-site-header-inner");
    const barEnd = header.indexOf("ks-site-header-brand");
    expect(header.slice(barStart, barEnd)).not.toContain("ks-theme");

    const menu = shell(<SideMenu open={true} onClose={() => {}} />);
    expect(menu).toContain("ks-menu-purple-btn");
    expect(menu).toContain('href="/account"');
    expect(menu).toContain('href="/cart"');
    expect(menu).toContain("ks-theme-track");
    const toggle = shell(<ThemeToggle />);
    expect(toggle).toContain("ks-theme-track");
    // Sun & Moon options are always present; the active one is highlighted (Req 8)
    expect(toggle).toContain("ks-theme-sun");
    expect(toggle).toContain("ks-theme-moon");
  });

  it("places back button on the visual right of overlay headers", () => {
    const html = shell(<OverlayHeader title="نمونه" onBack={() => {}} />);
    expect(html).toContain("ks-overlay-header");
    expect(html).toContain("ks-back-button");
    expect(html).toContain("بازگشت");
    const backIndex = html.indexOf("ks-back-button");
    const titleIndex = html.indexOf("ks-overlay-header-title");
    expect(backIndex).toBeGreaterThan(titleIndex);
  });

  it("renders category product cards as independent bordered text-only cards (Req 6: no product images)", () => {
    const html = shell(
      <Routes>
        <Route path="/category/:categoryId" element={<CategoryPage />} />
      </Routes>,
      "/category/shopping-basket",
    );
    expect(html).toContain("ks-category-product-grid");
    expect(html).toContain("ks-product-card");
    // Image-free: no image wrapper or <img> inside category product cards
    expect(html).not.toContain("ks-product-image-wrapper");
    expect(html).not.toContain("<img");
    // Cards still navigate to the internal Product Details page
    expect(html).toContain('href="/product/');
  });

  it("keeps footer quick links and removes the contact column", () => {
    const html = shell(<Footer />);
    expect(html).not.toContain("اطلاعات تماس");
    expect(html).not.toContain("tel:");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/products"');
    expect(html).toContain('href="/search"');
    expect(html).toContain('href="/account"');
    expect(html).toContain('href="/cart"');
    expect(html).not.toContain("/about");
    expect(html).not.toContain("/contact");
  });

  it("renders account overlay header and rounded card", () => {
    const html = shell(<AccountPage />);
    expect(html).toContain("ks-overlay-header");
    expect(html).toContain("حساب کاربری");
    expect(html).toContain("بازگشت");
    expect(html).toContain("rounded-[2rem]");
  });

  it("renders checkout back-to-cart label on the right and smaller centered title", () => {
    const html = shell(
      <OverlayHeader
        title="تکمیل سفارش"
        backLabel="بازگشت به سبد"
        titleClassName="ks-overlay-title-sm"
        onBack={() => {}}
      />,
    );
    expect(html).toContain("بازگشت به سبد");
    expect(html).toContain("ks-overlay-title-sm");
    expect(html).toContain("تکمیل سفارش");
  });

  it("keeps admin password field hidden by default with an inner-left eye toggle", () => {
    const html = shell(
      <AdminAuthProvider>
        <AdminLoginPage />
      </AdminAuthProvider>,
    );
    expect(html).toContain('type="password"');
    expect(html).toContain("left-2.5");
    expect(html).toContain("rounded-[2rem]");
    expect(html).not.toContain("mkhoshrou");
    expect(html).not.toContain("ADMIN_PASSWORD");
  });

  it("renders cart page overlay header and your-orders panel", () => {
    const html = shell(<CartPage />);
    expect(html).toContain("ks-overlay-header");
    expect(html).toContain("سبد خرید");
    expect(html).toContain("سفارشات شما");
  });

  it("hides price on category product cards", () => {
    const html = shell(
      <Routes>
        <Route path="/category/:categoryId" element={<CategoryPage />} />
      </Routes>,
      "/category/shopping-basket",
    );
    expect(html).toContain("ks-product-card");
    expect(html).not.toContain("قیمت موجود نیست");
  });
});
