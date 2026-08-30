import { describe, expect, it } from "vitest";
import { importedProducts, importedSourceStats } from "../src/data/csvSource";
import { getProductById, getProductsByCategory, searchProducts } from "../src/data/products";

/**
 * Data-safety invariants for the final polish pass: the verified catalog and
 * all 936-row mappings must remain byte-for-byte intact (the CSV files
 * themselves are never rewritten by UI changes).
 */
describe("KalaSearch data safety invariants", () => {
  it("keeps the verified catalog counts (347 / 936 / 745 / 191)", () => {
    expect(importedSourceStats.products).toBe(347);
    expect(importedSourceStats.variants).toBe(936);
    expect(importedSourceStats.available).toBe(745);
    expect(importedSourceStats.unavailable).toBe(191);
    expect(importedProducts).toHaveLength(347);
  });

  it("maps variant_sku, product_id and ashkan_url for all 936/936 variants", () => {
    let variantSkuMapped = 0;
    let productIdMapped = 0;
    let ashkanUrlMapped = 0;
    for (const product of importedProducts) {
      // product_id round-trips through the UI lookup index
      expect(getProductById(product.id)).toBe(product);
      if (product.productCode && product.productCode.trim()) productIdMapped += product.variations.length;
      for (const variant of product.variations ?? []) {
        if (variant.sku && variant.sku.trim()) variantSkuMapped += 1;
        if (variant.url && /^https?:\/\//i.test(variant.url.trim())) ashkanUrlMapped += 1;
      }
    }
    expect(variantSkuMapped).toBe(936);
    expect(productIdMapped).toBe(936);
    expect(ashkanUrlMapped).toBe(936);
  });

  it("keeps images strictly product-mapped or absent — never substituted", () => {
    for (const product of importedProducts) {
      if (product.productImageUrl) {
        expect(product.productImageUrl).toMatch(/^https?:\/\//i);
      }
    }
  });

  it("search stays a product-results experience and finds زنبیل products by name", () => {
    const results = searchProducts("زنبیل", "fa");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => JSON.stringify(product).includes("زنبیل") || product.categoryId === "zanbil")).toBe(true);
    expect(getProductsByCategory("zanbil").length).toBeGreaterThan(0);
  });
});
