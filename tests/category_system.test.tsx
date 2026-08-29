import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { categories } from "../src/data/categories";
import { importedOtherSubcategories } from "../src/data/csvSource";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../src/data/products";
import CategoryIcon from "../src/components/CategoryIcon";
import CategoryNav from "../src/components/CategoryNav";
import Logo from "../src/components/Logo";
import { LanguageProvider } from "../src/i18n/LanguageContext";

describe("KalaSearch Category UI (6 Main Cubes + 1 Other Cube)", () => {
  it("has exactly 7 main categories (6 primary + 1 other)", () => {
    expect(categories).toHaveLength(7);
    const categoryIds = categories.map((c) => c.id);
    expect(categoryIds).toEqual([
      "shopping-basket",
      "picnic-basket",
      "stool",
      "fruit-vegetable-basket",
      "colander-bowl",
      "freezer",
      "other",
    ]);
  });

  it("ensures 'other' is the 7th tile (centered in row 2)", () => {
    expect(categories[6].id).toBe("other");
    expect(categories[6].name.fa).toBe("سایر");
  });

  it("moves powder-sponge-holder and soap-dish into 'other' subcategories without deleting any data", () => {
    const otherSubIds = importedOtherSubcategories.map((s) => s.id);
    expect(otherSubIds).toContain("powder-sponge-holder");
    expect(otherSubIds).toContain("soap-dish");
    expect(otherSubIds).toContain("spice");
    expect(otherSubIds).toContain("bucket");
    expect(otherSubIds).toContain("basin-bathtub");
    expect(otherSubIds).toContain("flower-pot");

    const counts = getOtherSubcategoryCounts();
    expect(counts.some((s) => s.id === "powder-sponge-holder")).toBe(true);
    expect(counts.some((s) => s.id === "soap-dish")).toBe(true);
  });

  it("renders pure SVG vector markup for all primary category and subcategory icons", () => {
    for (const cat of categories) {
      const html = renderToString(<CategoryIcon id={cat.id} size={32} />);
      expect(html).toContain("<svg");
      expect(html).toContain("viewBox=\"0 0 24 24\"");
      expect(html).toContain("ks-category-icon");
    }

    for (const sub of importedOtherSubcategories) {
      const html = renderToString(<CategoryIcon id={sub.id} size={28} />);
      expect(html).toContain("<svg");
      expect(html).toContain("viewBox=\"0 0 24 24\"");
      expect(html).toContain("ks-category-icon");
    }
  });

  it("connects primary categories and moved subcategories to real products", () => {
    // 6 Main categories
    expect(getProductsByCategory("shopping-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("picnic-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("stool").length).toBeGreaterThan(0);
    expect(getProductsByCategory("fruit-vegetable-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("colander-bowl").length).toBeGreaterThan(0);
    expect(getProductsByCategory("freezer").length).toBeGreaterThan(0);

    // Moved subcategories inside "other"
    expect(getProductsByCategory("other", "powder-sponge-holder").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "soap-dish").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "bucket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "basin-bathtub").length).toBeGreaterThan(0);
  });

  it("renders CategoryNav with 6 cubes in row 1 + 1 cube centered in row 2 without horizontal scroll or 3rd row", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <CategoryNav />
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(html).toContain("ks-category-grid-6");
    expect(html).toContain("ks-category-row-other");
    const linkMatches = html.match(/href="\/category\/[^"]+"/g);
    expect(linkMatches).toHaveLength(7);
    expect(linkMatches?.[0]).toBe('href="/category/shopping-basket"');
    expect(linkMatches?.[6]).toBe('href="/category/other"');
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
