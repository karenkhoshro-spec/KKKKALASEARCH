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

  it("renders SearchPage with crystal close button and name-only product cards", () => {
    const html = renderToString(
      <MemoryRouter initialEntries={["/search?q=لگن"]}>
        <LanguageProvider>
          <ListContextProvider>
            <SearchPage />
          </ListContextProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("ks-crystal-close-btn");
    expect(html).not.toContain("ks-back-button");
    expect(html).not.toContain("قیمت نامشخص");
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
