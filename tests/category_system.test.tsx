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

describe("KalaSearch Category UI (8 Main Categories + 1 Other = 9 Tiles)", () => {
  it("has exactly 9 main categories (8 primary + 1 other)", () => {
    expect(categories).toHaveLength(9);
    const categoryIds = categories.map((c) => c.id);
    expect(categoryIds).toEqual([
      "shopping-basket",
      "picnic-basket",
      "stool",
      "powder-sponge-holder",
      "fruit-vegetable-basket",
      "colander-bowl",
      "freezer",
      "soap-dish",
      "other",
    ]);
  });

  it("ensures 'other' is the 9th tile (last option in main view)", () => {
    expect(categories[8].id).toBe("other");
    expect(categories[8].name.fa).toBe("سایر");
  });

  it("moves all non-main categories into 'other' subcategories without deleting any category", () => {
    const otherSubIds = importedOtherSubcategories.map((s) => s.id);
    const requiredMovedCategories = [
      "spice",
      "pitcher-glass",
      "juicer",
      "ice-holder",
      "butter-holder",
      "spoon-holder",
      "bucket",
      "basin-bathtub",
      "flower-pot",
      "plant-saucer",
      "shopping-basket-other",
      "oval-basket",
      "janani",
      "organizer",
      "laundry-basket",
      "kitchen-tools",
      "cleaning-tools",
      "storage",
      "tray",
      "chair",
      "hanger",
      "paper-holder",
      "toolbox",
      "straw-basket",
    ];

    for (const id of requiredMovedCategories) {
      expect(otherSubIds).toContain(id);
    }

    const counts = getOtherSubcategoryCounts();
    expect(counts.length).toBeGreaterThanOrEqual(20);
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
    // 8 Main categories
    expect(getProductsByCategory("shopping-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("picnic-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("stool").length).toBeGreaterThan(0);
    expect(getProductsByCategory("powder-sponge-holder").length).toBeGreaterThan(0);
    expect(getProductsByCategory("fruit-vegetable-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("colander-bowl").length).toBeGreaterThan(0);
    expect(getProductsByCategory("freezer").length).toBeGreaterThan(0);
    expect(getProductsByCategory("soap-dish").length).toBeGreaterThan(0);

    // Moved subcategories inside "other"
    expect(getProductsByCategory("other", "bucket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "basin-bathtub").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "spice").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "ice-holder").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "cleaning-tools").length).toBeGreaterThan(0);
  });

  it("renders CategoryNav with exactly 9 tiles in 2 rows without horizontal scroll or 3rd row", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <CategoryNav />
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(html).toContain("ks-category-grid-8");
    expect(html).toContain("ks-category-row-other");
    const linkMatches = html.match(/href="\/category\/[^"]+"/g);
    expect(linkMatches).toHaveLength(9);
    expect(linkMatches?.[0]).toBe('href="/category/shopping-basket"');
    expect(linkMatches?.[8]).toBe('href="/category/other"');
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
