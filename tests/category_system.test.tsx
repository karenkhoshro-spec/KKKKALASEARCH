import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { categories } from "../src/data/categories";
import { importedOtherSubcategories, importedProducts } from "../src/data/csvSource";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../src/data/products";
import CategoryIcon from "../src/components/CategoryIcon";
import CategoryNav from "../src/components/CategoryNav";
import Logo from "../src/components/Logo";
import { LanguageProvider } from "../src/i18n/LanguageContext";

describe("KalaSearch Category UI (Strict 2 Rows × 7 Items = 14 Tiles)", () => {
  it("has exactly 14 main categories (13 normal + 1 other)", () => {
    expect(categories).toHaveLength(14);
    const categoryIds = categories.map((c) => c.id);
    expect(categoryIds).toEqual([
      // Row 1 (7 items)
      "shopping-basket",
      "picnic-basket",
      "stool",
      "powder-sponge-holder",
      "fruit-vegetable-basket",
      "colander-bowl",
      "freezer",
      // Row 2 (7 items: 6 normal + سایر)
      "soap-dish",
      "spice",
      "pitcher-glass",
      "juicer",
      "bucket",
      "basin-bathtub",
      "other",
    ]);
  });

  it("ensures 'other' is the 14th tile (last tile of row 2)", () => {
    expect(categories[13].id).toBe("other");
    expect(categories[13].name.fa).toBe("سایر");
  });

  it("keeps ice-holder, butter-holder, spoon-holder, and flower-pot inside 'other' subcategories", () => {
    const otherSubIds = importedOtherSubcategories.map((s) => s.id);
    expect(otherSubIds).toContain("ice-holder");
    expect(otherSubIds).toContain("butter-holder");
    expect(otherSubIds).toContain("spoon-holder");
    expect(otherSubIds).toContain("flower-pot");

    const counts = getOtherSubcategoryCounts();
    expect(counts.some((s) => s.id === "ice-holder")).toBe(true);
    expect(counts.some((s) => s.id === "butter-holder")).toBe(true);
    expect(counts.some((s) => s.id === "spoon-holder")).toBe(true);
    expect(counts.some((s) => s.id === "flower-pot")).toBe(true);
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
    const bucketProducts = getProductsByCategory("bucket");
    expect(bucketProducts.length).toBeGreaterThan(0);

    const basinProducts = getProductsByCategory("basin-bathtub");
    expect(basinProducts.length).toBeGreaterThan(0);

    const spiceProducts = getProductsByCategory("spice");
    expect(spiceProducts.length).toBeGreaterThan(0);

    const shoppingBasketProducts = getProductsByCategory("shopping-basket");
    expect(shoppingBasketProducts.length).toBeGreaterThan(0);

    const iceProducts = getProductsByCategory("other", "ice-holder");
    expect(iceProducts.length).toBeGreaterThan(0);
  });

  it("renders CategoryNav with exactly 14 tiles in 2 rows x 7 cols without horizontal scroll or 3rd row", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <CategoryNav />
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(html).toContain("ks-category-grid-14");
    const linkMatches = html.match(/href="\/category\/[^"]+"/g);
    expect(linkMatches).toHaveLength(14);
    expect(linkMatches?.[0]).toBe('href="/category/shopping-basket"');
    expect(linkMatches?.[13]).toBe('href="/category/other"');
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
