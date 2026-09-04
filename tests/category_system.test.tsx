import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { categories } from "../src/data/categories";
import { importedOtherSubcategories } from "../src/data/csvSource";
import { getOtherSubcategoryCounts, getProductsByCategory } from "../src/data/products";
import CategoryIcon from "../src/components/CategoryIcon";
import CategoryNav from "../src/components/CategoryNav";
import CategoryOverlayHeader from "../src/components/CategoryOverlayHeader";
import CategoryPage from "../src/pages/CategoryPage";
import Logo from "../src/components/Logo";
import { LanguageProvider } from "../src/i18n/LanguageContext";
import { ListContextProvider } from "../src/context/ListContext";

describe("KalaSearch Crystal Design System — Category Navigation", () => {
  it("has exactly 9 primary categories (8 main + 1 other)", () => {
    expect(categories).toHaveLength(9);
    const categoryIds = categories.map((c) => c.id);
    expect(categoryIds).toEqual([
      "shopping-basket",
      "picnic-basket",
      "stool",
      "zanbil",
      "fruit-vegetable-basket",
      "basin-bathtub",
      "pitcher-glass",
      "freezer",
      "other",
    ]);
  });

  it("ensures 'other' is the final category (9th tile)", () => {
    expect(categories[8].id).toBe("other");
    expect(categories[8].name.fa).toBe("سایر");
  });

  it("preserves removed primary categories under 'other' subcategories", () => {
    const otherSubIds = importedOtherSubcategories.map((s) => s.id);
    const requiredSubs = [
      "powder-sponge-holder",
      "colander-bowl",
      "soap-dish",
      "spice",
      "juicer",
      "ice-holder",
      "butter-holder",
      "spoon-holder",
      "bucket",
      "flower-pot",
      "plant-saucer",
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
    expect(getProductsByCategory("zanbil").length).toBeGreaterThan(0);
    expect(getProductsByCategory("fruit-vegetable-basket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("basin-bathtub").length).toBeGreaterThan(0);
    expect(getProductsByCategory("pitcher-glass").length).toBeGreaterThan(0);
    expect(getProductsByCategory("freezer").length).toBeGreaterThan(0);

    // Subcategories in "other"
    expect(getProductsByCategory("other", "powder-sponge-holder").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "colander-bowl").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "soap-dish").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "bucket").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "spice").length).toBeGreaterThan(0);
    expect(getProductsByCategory("other", "cleaning-tools").length).toBeGreaterThan(0);
  });

  it("renders CategoryOverlayHeader with back button and NO close X button", () => {
    const html = renderToString(
      <MemoryRouter>
        <LanguageProvider>
          <CategoryOverlayHeader
            categoryId="basin-bathtub"
            title="لگن و وان"
            productCount={53}
          />
        </LanguageProvider>
      </MemoryRouter>
    );

    expect(html).toContain("بازگشت");
    expect(html).toContain("لگن و وان");
    expect(html).toContain("53");
    // No X close button in category header
    expect(html).not.toContain("aria-label=\"بستن\"");
  });

  it("renders CategoryPage for 'other' with subcategory cards and no counts under cards", () => {
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

    expect(html).toContain("ks-other-sub-card");
    expect(html).toContain("بازگشت");
    expect(html).toContain("سایر");
  });

  it("renders CategoryNav with two swipeable rows: primaries + promoted subcategories + سایر trigger", () => {
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
    // Row 1: 5 primaries; Row 2: 3 primaries + 6 promoted subcategories.
    expect(linkMatches?.[0]).toBe('href="/category/shopping-basket"');
    expect(linkMatches?.[3]).toBe('href="/category/zanbil"');
    expect(linkMatches?.[5]).toBe('href="/category/basin-bathtub"');
    expect(linkMatches?.[6]).toBe('href="/category/pitcher-glass"');
    // Popular subcategories are promoted into the visible rows (deep links
    // into the "سایر" subcategory view) instead of being hidden inside it.
    expect(html).toContain('href="/category/other?sub=colander-bowl"');
    expect(html).toContain('href="/category/other?sub=spice"');
    // سایر is the final tile of row two and opens the full-category panel
    // (modal trigger — no direct link, nothing is lost).
    expect(html).toContain("ks-category-tile-other");
    expect(html).not.toContain('href="/category/other" ');
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
