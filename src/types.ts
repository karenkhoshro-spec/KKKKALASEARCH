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
  /**
   * Implementation 9: Fields for future Excel import
   * quantity = تعداد
   * packQuantity = تعداد در بسته / سر بسته
   * Optional, no fake data - only structure for future Excel sync
   */
  quantity?: number;
  packQuantity?: number;
}

export interface Category {
  id: string;
  name: LocalizedText;
  icon: string;
}

export interface CartVariation {
  id: string;
  name: string;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
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
