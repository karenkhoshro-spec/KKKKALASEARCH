export type Lang = "fa" | "en" | "ar";

export interface LocalizedText {
  fa: string;
  en: string;
  ar: string;
}

export interface ProductVariation {
  id: string;
  name: LocalizedText;
  color?: string;
}

export interface Product {
  id: string;
  slug: string;
  /** Seller-facing product code (shown in cart / orders / PDF). */
  productCode: string;
  /** Stock keeping unit (SKU). */
  sku: string;
  /** Optional model name/number of the product. */
  model?: string;
  name: LocalizedText;
  description: LocalizedText;
  features: LocalizedText[];
  categoryId: string;
  price: number;
  oldPrice?: number;
  image: string;
  gallery?: string[];
  inStock: boolean;
  stockCount?: number;
  variations?: ProductVariation[];
  /**
   * Direct URL to the product page on the Ashkan Plastic website.
   * Configurable per-product. Leave empty string if not yet assigned —
   * in that case no link will be rendered (no fake/broken links).
   */
  ashkanProductUrl?: string;
}

export interface Category {
  id: string;
  name: LocalizedText;
  icon: string;
}

export interface CartVariation {
  id: string;
  name: string;
  /** Hex color of the chosen color variant, when the variation is a color. */
  color?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  /** Cart line identity = productId + variation.id (+ color/selection stored on the line). */
  productCode?: string;
  sku?: string;
  model?: string;
  variation?: CartVariation;
}

export type ListContextType =
  | { type: "home" }
  | { type: "search"; query: string }
  | { type: "category"; categoryId: string }
  | { type: "products" }
  | { type: "wishlist" };

export interface Account {
  phone: string;
  name?: string;
}
