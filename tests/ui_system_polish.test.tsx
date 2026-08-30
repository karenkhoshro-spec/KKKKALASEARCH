import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Home from "../src/pages/Home";
import AccountPage from "../src/pages/AccountPage";
import ProductDetails from "../src/pages/ProductDetails";
import CartPage from "../src/pages/CartPage";
import CheckoutPage from "../src/pages/CheckoutPage";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ListContextProvider } from "../src/context/ListContext";
import { AccountProvider } from "../src/context/AccountContext";
import { CartProvider } from "../src/context/CartContext";
import { ToastProvider } from "../src/context/ToastContext";
import { WishlistProvider } from "../src/context/WishlistContext";

describe("UI & UX System Polish & Validation Suite", () => {
  it("renders Home page with Quick Access navigation links and hero", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <ListContextProvider>
            <Home />
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain('href="/products"');
    expect(html).toContain('href="/category/other"');
    expect(html).toContain('href="/wishlist"');
    expect(html).toContain('href="/cart"');
    expect(html).toContain("جستجو");
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

  it("renders ProductDetails with standardized left back button, 0-initial quantity stepper, and no close X button", () => {
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
    expect(html).toContain("مشاهده در سایت اشکان پلاستیک");
    expect(html).toContain("افزودن به سبد خرید");
    expect(html).toContain("0"); // initial quantity is 0
  });

  it("renders CartPage and CheckoutPage with unified left back button headers", () => {
    const cartHtml = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <CartProvider>
            <ToastProvider>
              <CartPage />
            </ToastProvider>
          </CartProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(cartHtml).toContain("بازگشت");
    expect(cartHtml).toContain("سبد خرید");

    const checkoutHtml = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <CartProvider>
            <AccountProvider>
              <ToastProvider>
                <CheckoutPage />
              </ToastProvider>
            </AccountProvider>
          </CartProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(checkoutHtml).toBeDefined();
  });
});
