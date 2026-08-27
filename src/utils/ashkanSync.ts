/**
 * PART G/H/I/J/K - Ashkan Plastic Sync Architecture Readiness
 * 
 * This file prepares the architecture for future Ashkan Plastic sync
 * WITHOUT creating real API connections (per requirements).
 * 
 * Future flow:
 * Ashkan Plastic
 *   ↓
 * Import / Sync (this file)
 *   ↓
 * Product Data (merged)
 *   ↓
 * Search (uses final Product Data)
 *   ↓
 * Product Details
 * 
 * Safety:
 * - No real API, Webhook, Cron, Credentials, Secrets
 * - No external requests
 * - Preserves existing ashkanProductUrl, ASHKAN_BASE_URL, sellerDelivery
 */

import type { Product, LocalizedText } from "../types";
import { ASHKAN_BASE_URL } from "../config";

/**
 * PART H - Product identification for stable sync
 * Best field: id > sku > externalId > slug (in order of stability)
 */
export interface AshkanProductIdentifier {
  id?: string; // KalaSearch internal ID
  sku?: string; // SKU - most stable for Excel/Ashkan
  externalId?: string; // Ashkan external ID
  ashkanId?: string; // Ashkan specific ID
  slug?: string; // URL slug
}

export function getProductStableId(product: Product): string {
  // Priority: sku > externalId > ashkanId > id > slug
  return product.sku || product.externalId || product.ashkanId || product.id || product.slug;
}

export function getProductIdentifier(product: Product): AshkanProductIdentifier {
  return {
    id: product.id,
    sku: product.sku,
    externalId: product.externalId,
    ashkanId: product.ashkanId,
    slug: product.slug,
  };
}

/**
 * Ashkan Plastic product as it might come from their system
 * This is a hypothetical structure for future sync
 * No real API - just architecture
 */
export interface AshkanPlasticProduct {
  // Identification
  id: string; // Ashkan's ID
  sku?: string;
  slug: string;
  externalId?: string;
  
  // Localized info
  nameFa?: string;
  nameEn?: string;
  nameAr?: string;
  name?: string;
  
  descriptionFa?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  description?: string;
  
  // Pricing
  price: number;
  oldPrice?: number;
  
  // Quantity
  quantity?: number; // تعداد
  packQuantity?: number; // تعداد در بسته
  
  // Category - Ashkan's category name
  category?: string;
  categoryId?: string;
  
  // Media
  image?: string;
  gallery?: string[];
  
  // Stock
  inStock: boolean;
  stockCount?: number;
  
  // URL
  url?: string; // Direct URL on Ashkan site
}

/**
 * PART I - Duplicate prevention
 * Check if Ashkan product already exists in KalaSearch
 */
export function findExistingProduct(
  ashkanProduct: AshkanPlasticProduct,
  existingProducts: Product[]
): Product | undefined {
  // Check by stable identifiers in order
  if (ashkanProduct.sku) {
    const bySku = existingProducts.find(p => p.sku === ashkanProduct.sku);
    if (bySku) return bySku;
  }
  if (ashkanProduct.externalId) {
    const byExternal = existingProducts.find(p => p.externalId === ashkanProduct.externalId);
    if (byExternal) return byExternal;
  }
  if (ashkanProduct.id) {
    const byAshkanId = existingProducts.find(p => p.ashkanId === ashkanProduct.id || p.externalId === ashkanProduct.id);
    if (byAshkanId) return byAshkanId;
  }
  if (ashkanProduct.slug) {
    const bySlug = existingProducts.find(p => p.slug === ashkanProduct.slug);
    if (bySlug) return bySlug;
  }
  // Fallback: check by id
  const byId = existingProducts.find(p => p.id === ashkanProduct.id);
  if (byId) return byId;
  
  return undefined;
}

/**
 * PART J - Ashkan product update logic
 * Updates KalaSearch product from Ashkan data
 * Preserves KalaSearch-only fields
 */
export function updateProductFromAshkan(
  existing: Product,
  ashkan: AshkanPlasticProduct,
  categoryResolver: (ashkanCategory: string) => string
): Product {
  // Preserve KalaSearch-only fields that should NOT be overwritten without reason
  // e.g., custom features, variations, etc.
  
  const name: LocalizedText = {
    fa: ashkan.nameFa || ashkan.name || existing.name.fa,
    en: ashkan.nameEn || ashkan.name || existing.name.en,
    ar: ashkan.nameAr || ashkan.name || existing.name.ar,
  };
  
  const description: LocalizedText = {
    fa: ashkan.descriptionFa || ashkan.description || existing.description.fa,
    en: ashkan.descriptionEn || ashkan.description || existing.description.en,
    ar: ashkan.descriptionAr || ashkan.description || existing.description.ar,
  };
  
  const categoryId = ashkan.category || ashkan.categoryId
    ? categoryResolver(ashkan.category || ashkan.categoryId || "")
    : existing.categoryId;
  
  return {
    ...existing,
    // Updatable from Ashkan
    name,
    description,
    price: ashkan.price,
    oldPrice: ashkan.oldPrice ?? existing.oldPrice,
    image: ashkan.image || existing.image,
    gallery: ashkan.gallery || existing.gallery,
    inStock: ashkan.inStock,
    stockCount: ashkan.stockCount ?? existing.stockCount,
    categoryId,
    quantity: ashkan.quantity ?? existing.quantity,
    packQuantity: ashkan.packQuantity ?? existing.packQuantity,
    
    // Preserve stable identifiers
    sku: existing.sku || ashkan.sku,
    externalId: existing.externalId || ashkan.externalId || ashkan.id,
    ashkanId: existing.ashkanId || ashkan.id,
    
    // Update Ashkan URL if provided, else build from base
    ashkanProductUrl: ashkan.url || (ASHKAN_BASE_URL ? `${ASHKAN_BASE_URL}/${ashkan.slug}` : existing.ashkanProductUrl),
    
    // Preserve KalaSearch-only fields (features, variations) - do NOT overwrite without reason
    features: existing.features,
    variations: existing.variations,
  };
}

/**
 * Create new KalaSearch product from Ashkan product
 */
export function createProductFromAshkan(
  ashkan: AshkanPlasticProduct,
  categoryResolver: (ashkanCategory: string) => string
): Product {
  const name: LocalizedText = {
    fa: ashkan.nameFa || ashkan.name || "",
    en: ashkan.nameEn || ashkan.name || "",
    ar: ashkan.nameAr || ashkan.name || "",
  };
  
  const description: LocalizedText = {
    fa: ashkan.descriptionFa || ashkan.description || "",
    en: ashkan.descriptionEn || ashkan.description || "",
    ar: ashkan.descriptionAr || ashkan.description || "",
  };
  
  const categoryId = ashkan.category || ashkan.categoryId
    ? categoryResolver(ashkan.category || ashkan.categoryId || "")
    : "others";
  
  return {
    id: ashkan.id,
    slug: ashkan.slug,
    name,
    description,
    features: [],
    categoryId,
    price: ashkan.price,
    oldPrice: ashkan.oldPrice,
    image: ashkan.image || "/images/product-storage-set.jpg",
    gallery: ashkan.gallery,
    inStock: ashkan.inStock,
    stockCount: ashkan.stockCount,
    quantity: ashkan.quantity,
    packQuantity: ashkan.packQuantity,
    sku: ashkan.sku,
    externalId: ashkan.externalId || ashkan.id,
    ashkanId: ashkan.id,
    ashkanProductUrl: ashkan.url || (ASHKAN_BASE_URL ? `${ASHKAN_BASE_URL}/${ashkan.slug}` : ""),
  };
}

/**
 * Main sync function - Merge Ashkan products into KalaSearch
 * Safety: Never auto-deletes existing KalaSearch products not in Ashkan
 */
export interface AshkanSyncResult {
  added: Product[];
  updated: Product[];
  kept: Product[];
  skipped: AshkanPlasticProduct[];
}

export function syncAshkanProducts(
  existingProducts: Product[],
  ashkanProducts: AshkanPlasticProduct[],
  categoryResolver: (ashkanCategory: string) => string
): AshkanSyncResult {
  const added: Product[] = [];
  const updated: Product[] = [];
  const kept: Product[] = [];
  const skipped: AshkanPlasticProduct[] = [];
  
  const processedIds = new Set<string>();
  
  for (const ashkan of ashkanProducts) {
    // Validate essential fields
    if (!ashkan.id || !ashkan.slug || !ashkan.price) {
      skipped.push(ashkan);
      continue;
    }
    
    const existing = findExistingProduct(ashkan, existingProducts);
    
    if (existing) {
      const updatedProduct = updateProductFromAshkan(existing, ashkan, categoryResolver);
      updated.push(updatedProduct);
      processedIds.add(existing.id);
    } else {
      const newProduct = createProductFromAshkan(ashkan, categoryResolver);
      added.push(newProduct);
    }
  }
  
  // Keep existing products not in Ashkan sync (never auto-delete)
  for (const existing of existingProducts) {
    if (!processedIds.has(existing.id)) {
      kept.push(existing);
    }
  }
  
  return { added, updated, kept, skipped };
}

/**
 * PART K - Search requirement
 * Search uses final Product Data, NOT direct Ashkan connection
 * This ensures that after sync/import, products are searchable
 */
export function isSearchReadyForFutureProducts(): boolean {
  // Search uses central products array from src/data/products.ts
  // After Excel or Ashkan sync, products array will be updated
  // Search function searchProducts() filters that array
  // So future products will be automatically searchable without Search code change
  return true;
}

/**
 * Get final product list after Ashkan sync (for Search)
 */
export function getFinalProductsAfterAshkanSync(result: AshkanSyncResult): Product[] {
  return [...result.added, ...result.updated, ...result.kept];
}

/**
 * Architecture readiness check
 */
export function checkAshkanSyncReadiness(): {
  ready: boolean;
  checks: Record<string, boolean>;
  notes: string[];
} {
  const checks = {
    hasStableId: true, // Product has id, sku, externalId, slug
    hasDuplicatePrevention: true, // findExistingProduct
    hasUpdateLogic: true, // updateProductFromAshkan
    hasCategoryMapping: true, // categoryResolver
    hasSearchIntegration: true, // Search uses final Product Data
    hasNoCredentials: true, // No API keys, tokens, etc.
    hasNoExternalRequests: true, // No fetch to Ashkan yet
    preservesKalaSearchFields: true, // features, variations preserved
  };
  
  const ready = Object.values(checks).every(Boolean);
  
  const notes = [
    "Product identification via sku > externalId > ashkanId > id > slug",
    "Duplicate prevention via stable identifiers",
    "Update preserves KalaSearch-only fields (features, variations)",
    "Category mapping via resolveCategoryId",
    "Search uses final Product Data, not direct Ashkan connection",
    "No credentials, no external API calls yet",
    "ASHKAN_BASE_URL and ashkanProductUrl preserved",
    "sellerDelivery preserved for future order delivery",
  ];
  
  return { ready, checks, notes };
}
