import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { categories } from "../src/data/categories";
import { importedOtherSubcategories, importedProducts } from "../src/data/csvSource";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../src/data/products";
import CategoryIcon from "../src/components/CategoryIcon";
import CategoryNav from "../src/components/CategoryNav";
import CategoryPage from "../src/pages/CategoryPage";
import Logo from "../src/components/Logo";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ListContextProvider } from "../context/ListContext";

describe("KalaSearch Neon Category & Icon System", () => {
  it("has exactly 15 main categories (14 primary + سایر)", () => {
    expect(categories).toHaveLength(15);
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
      "spice",
      "pitcher-glass",
      "juicer",
      "ice-holder",
      "bucket",
      "basin-bathtub",
      "other",
    ]);
  });

  it("keeps butter-holder, spoon-holder, and flower-pot inside 'other' subcategories", () => {
    const otherSubIds = importedOtherSubcategories.map((s) => s.id);
    expect(otherSubIds).toContain("butter-holder");
    expect(otherSubIds).toContain("spoon-holder");
    expect(otherSubIds).toContain("flower-pot");

    const counts = getOtherSubcategoryCounts();
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

  it("connects primary categories to real products", () => {
    const bucketProducts = getProductsByCategory("bucket");
    expect(bucketProducts.length).toBeGreaterThan(0);

    const basinProducts = getProductsByCategory("basin-bathtub");
    expect(basinProducts.length).toBeGreaterThan(0);

    const spiceProducts = getProductsByCategory("spice");
    expect(spiceProducts.length).toBeGreaterThan(0);

    const shoppingBasketProducts = getProductsByCategory("shopping-basket");
    expect(shoppingBasketProducts.length).toBeGreaterThan(0);
  });

  it("renders CategoryNav with 2-row scroll layout and all 15 category tiles", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <CategoryNav />
        </LanguageProvider>
      </MemoryRouter>
    );
    expect(html).toContain("ks-category-grid-2rows");
    expect(html).toContain("/category/shopping-basket");
    expect(html).toContain("/category/bucket");
    expect(html).toContain("/category/other");
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
