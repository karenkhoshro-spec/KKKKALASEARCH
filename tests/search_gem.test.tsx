import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import SearchBar from "../src/components/SearchBar";
import Logo from "../src/components/Logo";
import { LanguageProvider } from "../src/i18n/LanguageContext";
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
