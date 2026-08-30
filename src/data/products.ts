import type { Category, LocalizedText, Product } from "../types";
import { importedCategories, importedProducts, getImportedProductById, getImportedProductsByCategory, getImportedOtherSubcategoryCounts, searchImportedProducts, normalizePersian } from "./csvSource";
import { LocalCsvProductProvider } from "./providers/ProductProvider";

/** The UI talks to this provider facade, not directly to a CSV schema. */
export const productProvider = new LocalCsvProductProvider({
  products: importedProducts,
  categories: importedCategories,
  getProductById: getImportedProductById,
  getProductsByCategory: getImportedProductsByCategory,
  searchProducts: searchImportedProducts,
});

export const products = productProvider.getProducts();

// Build-time-safe indexes: parsed once, then every lookup is O(1)/cached,
// so switching overlays never re-filters the whole catalog.
const productById = new Map(products.map((product) => [product.id, product]));
const productsByCategoryCache = new Map<string, Product[]>();

export const getProductById = (id: string) => productById.get(id);

export const getProductsByCategory = (categoryId: string, subcategoryId?: string): Product[] => {
  const key = subcategoryId ? `${categoryId}:${subcategoryId}` : categoryId;
  let cached = productsByCategoryCache.get(key);
  if (!cached) {
    cached = products.filter((product) => product.categoryId === categoryId && (!subcategoryId || product.subcategoryId === subcategoryId));
    productsByCategoryCache.set(key, cached);
  }
  return cached;
};

export const searchProducts = (query: string, lang: "fa" | "en" | "ar") => productProvider.searchProducts(query, lang);

export const getOtherSubcategoryCounts = getImportedOtherSubcategoryCounts;

export interface RelatedCategory {
  name: LocalizedText;
  icon: string;
  path: string;
}

/**
 * Small optional helper for the search overlay: when the term matches a
 * category or a "سایر" subcategory, the results page can show a
 * "دسته مرتبط" chip. The products themselves always stay search results.
 */
export function findRelatedCategoryForQuery(query: string): RelatedCategory | null {
  const q = normalizePersian(query);
  if (!q) return null;

  const topExact = importedCategories.find((category: Category) => normalizePersian(category.name.fa) === q);
  if (topExact) return { name: topExact.name, icon: topExact.icon, path: `/category/${topExact.id}` };

  const subExact = getImportedOtherSubcategoryCounts().find((sub) => normalizePersian(sub.name.fa) === q);
  if (subExact) return { name: subExact.name, icon: "📁", path: `/category/other?sub=${encodeURIComponent(subExact.id)}` };

  const topPartial = importedCategories.find((category: Category) => normalizePersian(category.name.fa).includes(q));
  if (topPartial) return { name: topPartial.name, icon: topPartial.icon, path: `/category/${topPartial.id}` };

  const subPartial = getImportedOtherSubcategoryCounts().find((sub) => normalizePersian(sub.name.fa).includes(q));
  if (subPartial) return { name: subPartial.name, icon: "📁", path: `/category/other?sub=${encodeURIComponent(subPartial.id)}` };

  return null;
}
