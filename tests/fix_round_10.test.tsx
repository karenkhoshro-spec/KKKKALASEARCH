import { afterEach, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import ThemeToggle from "../src/components/ThemeToggle";
import ProductDetails from "../src/pages/ProductDetails";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ThemeProvider, resolveInitialTheme } from "../src/context/ThemeContext";
import { ListContextProvider } from "../src/context/ListContext";
import { AccountProvider } from "../src/context/AccountContext";
import { CartProvider } from "../src/context/CartContext";
import { WishlistProvider } from "../src/context/WishlistContext";
import { ToastProvider } from "../src/context/ToastContext";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const THEME_KEY = "kala-search-theme";

function fakeLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    },
  });
  return store;
}

function renderToggle() {
  return renderToString(
    <LanguageProvider>
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    </LanguageProvider>,
  );
}

describe("10-item fix round (orders/PDF, categories, theme)", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).localStorage;
  });

  it("resolves NIGHT as the default for first visit (no saved preference)", () => {
    expect(resolveInitialTheme(null)).toBe("dark");
    expect(resolveInitialTheme("")).toBe("dark");
    expect(resolveInitialTheme("unexpected")).toBe("dark");
  });

  it("keeps an explicit Day choice across reloads, with the sun highlighted", () => {
    const store = fakeLocalStorage();
    store.set(THEME_KEY, "light");
    expect(resolveInitialTheme(store.get(THEME_KEY)!)).toBe("light");
    const html = renderToggle();
    expect(html).toContain("ks-theme-sun is-active");
    expect(html).not.toContain("ks-theme-moon is-active");
  });

  it("keeps an explicit Night choice across reloads, with the moon highlighted", () => {
    const store = fakeLocalStorage();
    store.set(THEME_KEY, "dark");
    expect(resolveInitialTheme(store.get(THEME_KEY)!)).toBe("dark");
    const html = renderToggle();
    expect(html).toContain("ks-theme-moon is-active");
    expect(html).not.toContain("ks-theme-sun is-active");
  });

  it("highlights the moon on first visit (default Night)", () => {
    const html = renderToggle();
    expect(html).toContain("ks-theme-moon is-active");
    expect(html).toContain("ks-theme-sun");
  });

  it("shows the real product image on ProductDetails (eager, real mapping)", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/product/1100312"]}>
        <LanguageProvider>
          <ListContextProvider>
            <AccountProvider>
              <CartProvider>
                <WishlistProvider>
                  <ToastProvider>
                    <Routes>
                      <Route path="/product/:id" element={<ProductDetails />} />
                    </Routes>
                  </ToastProvider>
                </WishlistProvider>
              </CartProvider>
            </AccountProvider>
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>,
    );
    expect(html).toContain("<img");
    expect(html).toContain('loading="eager"');
  });
});
