import { describe, expect, it } from "vitest";
import { importedPriceMappings, importedProducts, importedSourceStats, normalizePersian, parsePrice } from "../src/data/csvSource";
import { productProvider } from "../src/data/products";
import { resolveCartPrice } from "../src/context/CartContext";

describe("KalaSearch catalog and price mapping", () => {
  it("normalizes Persian spelling, spacing, نیم‌فاصله and digits", () => {
    expect(normalizePersian("آبکش  تخت‌  ۱۰۰۰")).toBe(normalizePersian("آبکش تخت 1000"));
    expect(normalizePersian("كالا ي" )).toBe(normalizePersian("کالا ی"));
  });

  it("preserves the expected CSV catalog size and exact SKU mappings", () => {
    expect(importedSourceStats.products).toBe(347);
    expect(importedSourceStats.variants).toBe(936);
    expect(importedPriceMappings).toHaveLength(936);
    expect(importedPriceMappings.every((mapping) => mapping.matchStatus === "exact" && mapping.confidence === 1)).toBe(true);
  });

  it("maps آبکش تخت 1000 to 54,000 تومان data", () => {
    const product = importedProducts.find((item) => item.productCode === "1100312");
    expect(product).toBeDefined();
    expect(product?.price).toBe(54000);
    expect(product?.variations?.every((variant) => variant.price === 54000)).toBe(true);
    expect(productProvider.getPrice("1100312").amount).toBe(54000);
  });

  it("keeps invalid and missing prices unavailable", () => {
    const product = importedProducts.find((item) => item.productCode === "1290031");
    expect(product?.price).toBeUndefined();
    expect(productProvider.getPrice("1290031").available).toBe(false);
    expect(parsePrice("")).toBeUndefined();
    expect(parsePrice("0")).toBeUndefined();
    expect(parsePrice("نامعتبر")).toBeUndefined();
  });

  it("keeps variants attached only to their own product and supports search", () => {
    const variants = productProvider.getVariants("1100312");
    expect(variants).toHaveLength(4);
    expect(variants.map((variant) => variant.sku)).toEqual(expect.arrayContaining(["110031202", "110031207"]));
    expect(productProvider.searchProducts("آبکش تخت 1000").some((item) => item.productCode === "1100312")).toBe(true);
  });

  it("uses the selected variant price in cart resolution", () => {
    const product = productProvider.getProductById("1100312");
    const variant = product?.variations?.find((item) => item.id === "110031207");
    expect(product && variant ? resolveCartPrice(product, { id: variant.id, name: variant.name.fa, price: variant.price }) : undefined).toBe(54000);
    expect(product ? resolveCartPrice(product) : undefined).toBe(54000);
  });
});
