import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import SearchBar from "../src/components/SearchBar";
import SearchPage from "../src/pages/SearchPage";
import Logo from "../src/components/Logo";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ListContextProvider } from "../src/context/ListContext";
import { searchProducts } from "../src/data/products";

describe("KalaSearch Search UI — Purple Gemstone & Crystal Glassmorphism", () => {
  it("renders SearchBar with unified crystal glassmorphism wrapper and purple gemstone button", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <SearchBar large />
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("ks-search-form");
    expect(html).toContain("ks-search-wrapper");
    expect(html).toContain("ks-search-inner");
    expect(html).toContain("ks-gem-button");
    expect(html).toContain("جستجو");
    expect(html).toContain("ks-gem-sparkle-icon");
    expect(html).toContain("ks-gem-facet-cut");
  });

  it("renders SearchPage with overlay header, category indicator, and catalog image cards", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/search?q=لگن"]}>
        <LanguageProvider>
          <ListContextProvider>
            <SearchPage />
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("بازگشت");
    expect(html).toContain('href="/category/basin-bathtub"');
    expect(html).toContain("مشاهده دسته کامل");
    expect(html).toContain("ks-category-product-grid");
    expect(html).toContain("ks-product-card");
    // Search result cards are now name-only (matching category browsing):
    // no image wrapper, no price, minimal card style.
    expect(html).toContain("is-minimal");
    expect(html).not.toContain("ks-product-image-wrapper");
    expect(html).not.toContain("تومان");
  });

  it("preserves search functionality and product search matching", () => {
    const results = searchProducts("آبکش", "fa");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((p) => p.name.fa.includes("آبکش"))).toBe(true);
  });

  it("preserves KalaSearch Logo and Animated Logo without alterations", () => {
    const html = renderToString(
      <LanguageProvider>
        <Logo />
      </LanguageProvider>
    );
    expect(html).toContain("کالا سرچ");
    expect(html).toContain("animate-spin-slow");
  });
});
