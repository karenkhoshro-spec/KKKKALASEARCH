import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Home from "../src/pages/Home";
import AccountPage from "../src/pages/AccountPage";
import ProductDetails from "../src/pages/ProductDetails";
import CartPage from "../src/pages/CartPage";
import CategoryPage from "../src/pages/CategoryPage";
import SideMenu from "../src/components/SideMenu";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { ListContextProvider } from "../src/context/ListContext";
import { AccountProvider } from "../src/context/AccountContext";
import { CartProvider } from "../src/context/CartContext";
import { ToastProvider } from "../src/context/ToastContext";
import { WishlistProvider } from "../src/context/WishlistContext";

describe("UI & UX System Polish & Validation Suite", () => {
  it("renders Home page with hero and category grid (without quick access cards)", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <ListContextProvider>
            <Home />
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("جستجو");
    // Categories render as ONE compact horizontal slider under the title;
    // the price-sort control lives in the همه محصولات header.
    expect(html).toContain("دسته‌بندی محصولات");
    expect(html).toContain("ارزان‌ترین");
    expect(html).toContain('href="/category/shopping-basket"');
    // سایر is the final slider card and opens the full-category panel
    // instead of being a plain link.
    expect(html).toContain("ks-category-slider");
    expect(html).toContain("ks-category-card--other");
    // Main product cards live under همه محصولات with an expand control
    expect(html).toContain("همه محصولات");
    expect(html).toContain("مشاهده بیشتر");
    // No favorites / wishlist anywhere on the home page
    expect(html).not.toContain('href="/wishlist"');
    // The banned promotional heading is gone
    expect(html).not.toContain("بهترین لوازم پلاستیکی");
  });

  it("renders CategoryPage for 'other' with the 3 prominent subcategory cards", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/category/other"]}>
        <LanguageProvider>
          <ListContextProvider>
            <Routes>
              <Route path="/category/:categoryId" element={<CategoryPage />} />
            </Routes>
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("جا پودری و اسکاجی");
    expect(html).toContain("آبکش و کاسه");
    expect(html).toContain("جاصابونی");
    expect(html).toContain("ks-other-sub-card");
    expect(html).not.toContain("سایر زیردسته‌ها");
  });

  it("renders AccountPage with Phone / Email method switch and 4-digit OTP cells", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <AccountProvider>
            <ToastProvider>
              <AccountPage />
            </ToastProvider>
          </AccountProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("شماره موبایل");
    expect(html).toContain("ایمیل");
    expect(html).toContain("بازگشت");
    expect(html).toContain("ارسال کد تأیید");
  });

  it("renders ProductDetails with clean layout, eager image loading, 0-initial quantity, and no extra badge above image", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/product/1290031"]}>
        <LanguageProvider>
          <ListContextProvider>
            <CartProvider>
              <WishlistProvider>
                <ToastProvider>
                  <Routes>
                    <Route path="/product/:id" element={<ProductDetails />} />
                  </Routes>
                </ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("بازگشت");
    expect(html).toContain('loading="eager"');
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain("مشاهده محصول در سایت اشکان پلاستیک");
    expect(html).toContain("مشخصات کامل");
    expect(html).toContain("افزودن به سبد خرید");
    expect(html).toContain("0"); // initial quantity is 0
    // کد محصول / شناسه کالا no longer clutter the upper product area — they
    // live inside the مشخصات کامل section (source-verified below).
    expect(html).not.toContain("کد محصول");
    expect(html).not.toContain("شناسه کالا");
  });

  it("renders ProductDetails for out-of-stock product with clean out-of-stock badge and summary card", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/product/1290031"]}>
        <LanguageProvider>
          <ListContextProvider>
            <CartProvider>
              <WishlistProvider>
                <ToastProvider>
                  <Routes>
                    <Route path="/product/:id" element={<ProductDetails />} />
                  </Routes>
                </ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("مشخصات کامل");
    expect(html).toContain("مشاهده محصول در سایت اشکان پلاستیک");
    // Identifiers are spec-section content only (cleaner top area)
    expect(html).not.toContain("کد محصول");
    expect(html).not.toContain("شناسه کالا");
  });

  it("renders SideMenu with uniform crystal cards and About Us overlay trigger", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <ThemeProvider>
            <AccountProvider>
              <CartProvider>
                <WishlistProvider>
                  <SideMenu open={true} onClose={() => {}} />
                </WishlistProvider>
              </CartProvider>
            </AccountProvider>
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain('href="/"');
    expect(html).toContain('href="/account"');
    expect(html).toContain('href="/cart"');
    // Favorites removed from the hamburger menu (Requirement 3); neon
    // calculator entry is present instead.
    expect(html).toContain('href="/calculator"');
    expect(html).not.toContain('href="/wishlist"');
    expect(html).toContain("درباره ما");
    // Removed from UI menu per Requirement 1
    expect(html).not.toContain('href="/products"');
    expect(html).not.toContain('href="/category/other"');
  });

  it("renders CartPage with standardized 3-column crystal header", () => {
    const cartHtml = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <AccountProvider>
            <CartProvider>
              <ToastProvider>
                <CartPage />
              </ToastProvider>
            </CartProvider>
          </AccountProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(cartHtml).toContain("بازگشت");
    expect(cartHtml).toContain("سبد خرید");
  });

  it("renders ProductDetails for in-stock variant product with price, color options, and spec count", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/product/1100312"]}>
        <LanguageProvider>
          <ListContextProvider>
            <CartProvider>
              <WishlistProvider>
                <ToastProvider>
                  <Routes>
                    <Route path="/product/:id" element={<ProductDetails />} />
                  </Routes>
                </ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("آبکش تخت 1000");
    expect(html).toContain("موجود در انبار");
    expect(html).toContain("54,000");
    expect(html).toContain("تومان");
    expect(html).toContain("مشاهده محصول در سایت اشکان پلاستیک");
    // Identifiers are NOT in the upper/main area...
    expect(html).not.toContain("کد محصول");
    expect(html).not.toContain("شناسه کالا");
    // ...but ARE part of the مشخصات کامل specification list (rendered when
    // the accordion opens — verified at the source level).
    const source = readFileSync("src/pages/ProductDetails.tsx", "utf8");
    const specsBlock = source.slice(source.indexOf("const allSpecifications"), source.indexOf("const allSpecifications") + 900);
    expect(specsBlock).toContain("کد محصول");
    expect(specsBlock).toContain("شناسه کالا");
  });
});
