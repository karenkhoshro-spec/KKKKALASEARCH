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

describe("KalaSearch Crystal Design System — Category Navigation", () => {
  it("has exactly 9 primary categories (8 main + 1 other)", () => {
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

  it("ensures 'other' is the final category (9th tile)", () => {
    expect(categories[8].id).toBe("other");
    expect(categories[8].name.fa).toBe("سایر");
  });

  it("preserves all subcategories inside 'other'", () => {
    const otherSubIds = importedOtherSubcategories.map((s) => s.id);
    const requiredSubs = [
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

    for (const id of requiredSubs) {
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

  it("connects primary categories and subcategories to real products", () => {
    // 8 Main categories
    expect(getProductsByCategory("shopping-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("picnic-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("stool").length).toBeGreaterThan(0);
    expect(getProductsByCategory("powder-sponge-holder").length).toBeGreaterThan(0);
    expect(getProductsByCategory("fruit-vegetable-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("colander-bowl").length).toBeGreaterThan(0);
    expect(getProductsByCategory("freezer").length).toBeGreaterThan(0);
    expect(getProductsByCategory("soap-dish").length).toBeGreaterThan(0);

    // Subcategories in "other"
    expect(getProductsByCategory("other", "shopping-basket-other").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "bucket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "basin-bathtub").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "spice").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "ice-holder").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "cleaning-tools").length).toBeGreaterThan(0);
  });

  it("renders CategoryNav with two 4-item rows + centered 'other' tile", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <CategoryNav />
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(html).toContain("ks-category-grid-4");
    expect(html).toContain("ks-category-row-other");
    const linkMatches = html.match(/href="\/category\/[^"]+"/g);
    expect(linkMatches).toHaveLength(9);
    expect(linkMatches?.[0]).toBe('href="/category/shopping-basket"');
    expect(linkMatches?.[5]).toBe('href="/category/colander-bowl"');
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
