import type { Category, Product, ProductVariation } from "../../types";

export interface ProductPrice {
  productId: string;
  variantId?: string;
  amount?: number;
  currency: string;
  source: string;
  available: boolean;
}

export interface ProductInventory {
  productId: string;
  variantId?: string;
  stockCount?: number;
  available: boolean;
  source: string;
}

/** The stable application-facing contract for any product source. */
export interface ProductProvider {
  getProducts(): Product[];
  getProductById(id: string): Product | undefined;
  searchProducts(query: string, lang?: "fa" | "en" | "ar"): Product[];
  getCategories(): Category[];
  getVariants(productId: string): ProductVariation[];
  getPrice(productId: string, variantId?: string): ProductPrice;
  getInventory(productId: string, variantId?: string): ProductInventory;
}

/** Async contract for a future API/database provider. The current local provider remains synchronous for backward compatibility. */
export interface AsyncProductProvider {
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  searchProducts(query: string, lang?: "fa" | "en" | "ar"): Promise<Product[]>;
  getCategories(): Promise<Category[]>;
  getVariants(productId: string): Promise<ProductVariation[]>;
  getPrice(productId: string, variantId?: string): Promise<ProductPrice>;
  getInventory(productId: string, variantId?: string): Promise<ProductInventory>;
}

export class LocalCsvProductProvider implements ProductProvider {
  constructor(
    private readonly source: {
      products: Product[];
      categories: Category[];
      getProductById: (id: string) => Product | undefined;
      getProductsByCategory?: (categoryId: string, subcategoryId?: string) => Product[];
      searchProducts: (query: string) => Product[];
    },
  ) {}

  getProducts() { return this.source.products; }
  getProductById(id: string) { return this.source.getProductById(id); }
  searchProducts(query: string, _lang?: "fa" | "en" | "ar") { return this.source.searchProducts(query); }
  getCategories() { return this.source.categories; }
  getVariants(productId: string) { return this.getProductById(productId)?.variations ?? []; }
  getPrice(productId: string, variantId?: string): ProductPrice {
    const product = this.getProductById(productId);
    const variant = variantId ? product?.variations?.find((item) => item.id === variantId) : undefined;
    const amount = variant ? variant.price : product?.price;
    return { productId, variantId, amount, currency: "IRR", source: "kala_search_inventory.csv", available: amount !== undefined };
  }
  getInventory(productId: string, variantId?: string): ProductInventory {
    const product = this.getProductById(productId);
    const variant = variantId ? product?.variations?.find((item) => item.id === variantId) : undefined;
    return { productId, variantId, stockCount: variant?.stockCount ?? product?.stockCount, available: variant?.inStock ?? product?.inStock ?? false, source: "local-csv" };
  }
}
