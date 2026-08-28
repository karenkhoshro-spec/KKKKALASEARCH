import { importedProducts, getImportedProductById, getImportedProductsByCategory, searchImportedProducts } from "./csvSource";
export const products = importedProducts;
export const getProductById = getImportedProductById;
export const getProductsByCategory = getImportedProductsByCategory;
export const searchProducts = (query: string, _lang: "fa" | "en" | "ar") => searchImportedProducts(query);
