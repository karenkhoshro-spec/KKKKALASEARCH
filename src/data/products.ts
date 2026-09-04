import { importedCategories, importedProducts, getImportedProductById, getImportedProductsByCategory, getImportedOtherSubcategoryCounts, searchImportedProducts } from "./csvSource";
import { LocalCsvProductProvider } from "./providers/ProductProvider";
import type { Product } from "../types";
import { isValidImageUrl } from "./productImageResolver";

/** The UI talks to this provider facade, not directly to a CSV schema. */
export const productProvider = new LocalCsvProductProvider({
  products: importedProducts,
  categories: importedCategories,
  getProductById: getImportedProductById,
  getProductsByCategory: getImportedProductsByCategory,
  searchProducts: searchImportedProducts,
});

export const products = productProvider.getProducts();
export const getProductById = (id: string) => productProvider.getProductById(id);
export const getProductsByCategory = (categoryId: string, subcategoryId?: string) =>
  getImportedProductsByCategory(categoryId, subcategoryId);
export const searchProducts = (query: string, lang: "fa" | "en" | "ar") => productProvider.searchProducts(query, lang);
export const getOtherSubcategoryCounts = getImportedOtherSubcategoryCounts;

/**
 * The first REAL image URL usable for customer-facing rendering
 * (productImages.json mapping → product.image → a variation image).
 * Returns undefined when the product has no usable remote image at all.
 */
export function productUsableImageUrl(product: Product): string | undefined {
  const candidates: Array<string | undefined> = [
    (product as { productImageUrl?: string }).productImageUrl,
    product.image,
    ...(product.variations ?? []).map((v) => v.image),
  ];
  for (const candidate of candidates) {
    if (candidate && isValidImageUrl(String(candidate).trim())) {
      return String(candidate).trim();
    }
  }
  return undefined;
}

/**
 * Customer-facing grids never show broken/empty image cards: products whose
 * mapping has no usable remote image are hidden from listings (their full
 * product page stays reachable by direct id/URL and keeps the honest
 * "تصویر موجود نیست" state).
 */
export function isProductListable(product: Product): boolean {
  return productUsableImageUrl(product) !== undefined;
}

/** Category listing filtered for customer display (image-backed products only). */
export function getListableProductsByCategory(categoryId: string, subcategoryId?: string): Product[] {
  return getImportedProductsByCategory(categoryId, subcategoryId).filter(isProductListable);
}

/** Search results filtered for customer display. */
export function searchListableProducts(query: string, lang: "fa" | "en" | "ar"): Product[] {
  return productProvider.searchProducts(query, lang).filter(isProductListable);
}
