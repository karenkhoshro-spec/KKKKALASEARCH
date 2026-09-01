export type Lang = "fa" | "en" | "ar";
export interface LocalizedText { fa: string; en: string; ar: string; }
export interface ProductVariation {
  id: string; name: LocalizedText; color?: string; colorName?: string; sku?: string; price?: number; image?: string; stockCount?: number;
  packQuantity?: number; inStock: boolean; url?: string; technicalSpec?: string;
}
export interface Product {
  id: string; slug: string; name: LocalizedText; description: LocalizedText;
  features: LocalizedText[]; categoryId: string; price?: number; oldPrice?: number;
  image: string; gallery?: string[]; inStock: boolean; stockCount?: number;
  packQuantity?: number; sku?: string; productCode?: string; brand?: string;
  variations?: ProductVariation[]; variants?: ProductVariation[]; subcategoryId?: string; ashkanProductUrl?: string; productUrl?: string; productImageUrl?: string; externalProductId?: string; externalSku?: string; externalSource?: string; lastSyncedAt?: string; syncStatus?: "success" | "error" | "offline";
  sourceRows?: Record<string, string>[];
}
export interface Category { id: string; name: LocalizedText; icon: string; sortOrder?: number; }
export interface CartVariation { id: string; name: string; sku?: string; price?: number; color?: string; colorHex?: string; image?: string; }
export interface CartItem { productId: string; name: string; image: string; price?: number; quantity: number; variation?: CartVariation; }
export type ListContextType = { type: "home" } | { type: "search"; query: string } | { type: "category"; categoryId: string } | { type: "products" } | { type: "wishlist" };
export interface Account { phone: string; name?: string; firstName?: string; lastName?: string; }
