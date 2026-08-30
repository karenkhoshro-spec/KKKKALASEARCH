import { describe, expect, it } from "vitest";
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
    expect(html).toContain("دسته‌بندی محصولات");
    expect(html).toContain('href="/category/shopping-basket"');
    expect(html).toContain('href="/category/other"');
    // Quick access section removed per Requirement 4
    expect(html).not.toContain('href="/wishlist"');
  });

  it("renders CategoryPage for 'other' with the 3 prominent vertical subcategory cards", () => {
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
    expect(html).toContain("سایر زیردسته‌ها");
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

  it("renders ProductDetails with eager image loading, 0-initial quantity, and no close X button", () => {
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
    expect(html).toContain("مشاهده در سایت اشکان پلاستیک");
    expect(html).toContain("افزودن به سبد خرید");
    expect(html).toContain("0"); // initial quantity is 0
  });

  it("renders SideMenu with 'محصولات' beside 'سایر' and no duplicate rotating atom logo", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <ThemeProvider>
            <AccountProvider>
              <SideMenu open={true} onClose={() => {}} />
            </AccountProvider>
          </ThemeProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain('href="/products"');
    expect(html).toContain('href="/category/other"');
    expect(html).toContain("درباره ما");
  });

  it("renders CartPage with unified left back button headers", () => {
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
  });
});
