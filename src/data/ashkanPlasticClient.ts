import type { Category, Product, ProductVariation } from "../types";

/**
 * Future transport adapter. Keep authentication on a trusted backend; this
 * client intentionally accepts no API key/token and is not used by the app
 * until a public, approved API endpoint is configured.
 */
export class AshkanPlasticClient {
  constructor(private readonly baseUrl: string) {}

  private async get<T>(path: string): Promise<T> {
    if (!this.baseUrl) throw new Error("Ashkan API is not configured");
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}${path}`);
    if (!response.ok) throw new Error(`Ashkan API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }

  getProducts() { return this.get<Product[]>("/api/products"); }
  getProduct(id: string) { return this.get<Product>(`/api/products/${encodeURIComponent(id)}`); }
  searchProducts(query: string) { return this.get<Product[]>(`/api/search?q=${encodeURIComponent(query)}`); }
  getCategories() { return this.get<Category[]>("/api/categories"); }
  getVariants(productId: string) { return this.get<ProductVariation[]>(`/api/products/${encodeURIComponent(productId)}/variants`); }
  getPrice(productId: string) { return this.get<unknown>(`/api/products/${encodeURIComponent(productId)}/price`); }
  getInventory(productId: string) { return this.get<unknown>(`/api/inventory/${encodeURIComponent(productId)}`); }
  getProductLink(productId: string) { return this.get<{ url?: string }>(`/api/products/${encodeURIComponent(productId)}/link`); }
}
