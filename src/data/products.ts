import { importedCategories, importedProducts, getImportedProductById, getImportedProductsByCategory, getImportedOtherSubcategoryCounts, searchImportedProducts } from "./csvSource";
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
export const getProductById = (id: string) => productProvider.getProductById(id);
export const getProductsByCategory = (categoryId: string, subcategoryId?: string) =>
  getImportedProductsByCategory(categoryId, subcategoryId);
export const searchProducts = (query: string, lang: "fa" | "en" | "ar") => productProvider.searchProducts(query, lang);
export const getOtherSubcategoryCounts = getImportedOtherSubcategoryCounts;
