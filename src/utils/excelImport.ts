/**
 * PART C/D/E/F - Excel Import Architecture
 * 
 * This file prepares the architecture for future Excel import
 * WITHOUT importing real Excel data yet (per requirements).
 * 
 * Design principles:
 * - No fake data
 * - Merge, not Replace (keep Product D if not in Excel)
 * - Configurable column mapping
 * - Preserve existing product fields
 * - Category mapping to existing 15 categories
 */

import type { Product, LocalizedText } from "../types";
import { categories } from "../data/categories";

/**
 * Excel column mapping - configurable for different Excel formats
 * Maps Excel column names (Persian/English) to Product fields
 */
export interface ExcelColumnMapping {
  // Product identification
  id?: string; // کد کالا / Product Code
  sku?: string; // SKU
  externalId?: string; // External ID
  slug?: string; // Slug
  
  // Product info
  nameFa?: string; // نام کالا فارسی
  nameEn?: string; // نام کالا انگلیسی
  nameAr?: string; // نام کالا عربی
  name?: string; // نام کالا (generic)
  
  descriptionFa?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  description?: string;
  
  // Pricing
  price?: string; // قیمت
  oldPrice?: string; // قیمت قبلی
  
  // Quantity fields (Implementation 9)
  quantity?: string; // تعداد
  packQuantity?: string; // تعداد در بسته / سر بسته
  
  // Category
  category?: string; // دسته‌بندی
  categoryId?: string;
  
  // Media
  image?: string; // تصویر
  gallery?: string;
  
  // Stock
  inStock?: string; // موجودی
  stockCount?: string;
  
  // Ashkan
  ashkanProductUrl?: string;
  ashkanId?: string;
}

/**
 * Default mapping for typical Persian Excel files
 * Can be customized per Excel file
 */
export const DEFAULT_EXCEL_MAPPING: ExcelColumnMapping = {
  id: "کد کالا",
  sku: "SKU",
  externalId: "External ID",
  nameFa: "نام کالا",
  name: "نام کالا",
  descriptionFa: "توضیحات",
  description: "توضیحات",
  price: "قیمت",
  oldPrice: "قیمت قبلی",
  quantity: "تعداد",
  packQuantity: "تعداد در بسته",
  category: "دسته‌بندی",
  image: "تصویر",
  inStock: "موجودی",
};

/**
 * English mapping alternative
 */
export const ENGLISH_EXCEL_MAPPING: ExcelColumnMapping = {
  id: "Product Code",
  sku: "SKU",
  externalId: "External ID",
  name: "Product Name",
  nameEn: "Product Name",
  description: "Description",
  price: "Price",
  oldPrice: "Old Price",
  quantity: "Quantity",
  packQuantity: "Pack Quantity",
  category: "Category",
  image: "Image",
  inStock: "In Stock",
};

/**
 * Category mapping from Excel category names to site category IDs
 * Handles Persian, English, and variations
 */
export const CATEGORY_MAPPING: Record<string, string> = {
  // Persian mappings
  "سبد خرید": "shopping-basket",
  "سبد پیکنیک": "picnic-basket",
  "چهار پایه": "stool",
  "چهارپایه": "stool",
  "جا پودری": "powder-sponge-holder",
  "جا پودری/اسکاجی": "powder-sponge-holder",
  "اسکاجی": "powder-sponge-holder",
  "سبد میوه": "fruit-veg-basket",
  "سبد میوه و سبزی": "fruit-veg-basket",
  "میوه و سبزی": "fruit-veg-basket",
  "آبکش": "colander-bowl",
  "آبکش و سبد و کاسه": "colander-bowl",
  "کاسه": "colander-bowl",
  "فریزری": "freezer",
  "ظروف فریزری": "freezer",
  "جاصابونی": "soap-holder",
  "جا صابونی": "soap-holder",
  "جا ادویه": "spice-holder",
  "ادویه": "spice-holder",
  "پارچ و لیوان": "pitcher-glass",
  "پارچ": "pitcher-glass",
  "لیوان": "pitcher-glass",
  "آبمیوه گیری": "juicer",
  "آبمیوه‌گیری": "juicer",
  "جا یخی": "ice-holder",
  "جایخی": "ice-holder",
  "سطل": "bucket",
  "لگن": "basin-tub",
  "لگن و وان": "basin-tub",
  "وان": "basin-tub",
  "سایر": "others",
  "متفرقه": "others",
  
  // English mappings
  "shopping basket": "shopping-basket",
  "picnic basket": "picnic-basket",
  "stool": "stool",
  "fruit basket": "fruit-veg-basket",
  "colander": "colander-bowl",
  "freezer": "freezer",
  "soap holder": "soap-holder",
  "spice holder": "spice-holder",
  "pitcher": "pitcher-glass",
  "juicer": "juicer",
  "ice holder": "ice-holder",
  "bucket": "bucket",
  "basin": "basin-tub",
  "others": "others",
  
  // Legacy mappings (old categories)
  "storage": "freezer",
  "laundry": "shopping-basket",
  "kitchen": "spice-holder",
  "hanger": "others",
  "trash": "bucket",
};

/**
 * Resolve Excel category name to site category ID
 * Returns valid category ID or 'others' as fallback
 */
export function resolveCategoryId(excelCategory: string): string {
  if (!excelCategory) return "others";
  
  const normalized = excelCategory.trim().toLowerCase();
  
  // Direct mapping
  if (CATEGORY_MAPPING[excelCategory]) {
    return CATEGORY_MAPPING[excelCategory];
  }
  if (CATEGORY_MAPPING[normalized]) {
    return CATEGORY_MAPPING[normalized];
  }
  
  // Check if it's already a valid category ID
  const validIds = categories.map(c => c.id);
  if (validIds.includes(excelCategory) || validIds.includes(normalized)) {
    return validIds.includes(excelCategory) ? excelCategory : normalized;
  }
  
  // Fallback to others - no fake category creation
  return "others";
}

/**
 * Excel row type - represents a single row from Excel
 * All fields optional to handle varying Excel structures
 */
export interface ExcelRow {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Import result for a single product
 */
export type ImportAction = "add" | "update" | "keep" | "skip";

export interface ImportResult {
  action: ImportAction;
  product: Product;
  excelRow: ExcelRow;
  reason?: string;
}

/**
 * Main import function - Merge logic (PART D)
 * 
 * Safety: Never deletes Product D if not in Excel
 * 
 * Excel: A, B, C
 * Existing: A, D
 * Result: A→Update, B→Add, C→Add, D→Keep
 */
export function mergeProductsFromExcel(
  existingProducts: Product[],
  excelRows: ExcelRow[],
  mapping: ExcelColumnMapping = DEFAULT_EXCEL_MAPPING
): ImportResult[] {
  const results: ImportResult[] = [];
  const existingById = new Map(existingProducts.map(p => [p.id, p]));
  const existingBySku = new Map(existingProducts.filter(p => p.sku).map(p => [p.sku!, p]));
  const existingByExternalId = new Map(existingProducts.filter(p => p.externalId).map(p => [p.externalId!, p]));
  const existingBySlug = new Map(existingProducts.map(p => [p.slug, p]));
  
  const processedIds = new Set<string>();
  
  // Process Excel rows
  for (const row of excelRows) {
    const excelId = String(row[mapping.id || ""] || row["id"] || "").trim();
    const excelSku = String(row[mapping.sku || ""] || "").trim();
    const excelExternalId = String(row[mapping.externalId || ""] || "").trim();
    const excelSlug = String(row[mapping.slug || ""] || "").trim();
    
    // Try to find existing product by stable identifiers (duplicate prevention)
    let existing: Product | undefined;
    if (excelId && existingById.has(excelId)) {
      existing = existingById.get(excelId);
    } else if (excelSku && existingBySku.has(excelSku)) {
      existing = existingBySku.get(excelSku);
    } else if (excelExternalId && existingByExternalId.has(excelExternalId)) {
      existing = existingByExternalId.get(excelExternalId);
    } else if (excelSlug && existingBySlug.has(excelSlug)) {
      existing = existingBySlug.get(excelSlug);
    }
    
    if (existing) {
      // Update existing product - preserve KalaSearch-only fields
      const updated = updateProductFromExcelRow(existing, row, mapping);
      results.push({ action: "update", product: updated, excelRow: row });
      processedIds.add(existing.id);
    } else {
      // Add new product
      const newProduct = createProductFromExcelRow(row, mapping);
      if (newProduct) {
        results.push({ action: "add", product: newProduct, excelRow: row });
      } else {
        results.push({ action: "skip", product: null as any, excelRow: row, reason: "Invalid row data" });
      }
    }
  }
  
  // Keep products not in Excel (CRITICAL SAFETY - never auto-delete)
  for (const existing of existingProducts) {
    if (!processedIds.has(existing.id)) {
      results.push({ action: "keep", product: existing, excelRow: {} });
    }
  }
  
  return results;
}

/**
 * Update existing product from Excel row
 * Only overwrites fields that come from Excel, preserves KalaSearch-only fields
 */
function updateProductFromExcelRow(existing: Product, row: ExcelRow, mapping: ExcelColumnMapping): Product {
  const getVal = (key?: string) => key ? row[key] : undefined;
  
  // Helper to get localized text
  const getLocalized = (faKey?: string, enKey?: string, arKey?: string, genericKey?: string): LocalizedText | undefined => {
    const fa = faKey ? String(getVal(faKey) || "").trim() : "";
    const en = enKey ? String(getVal(enKey) || "").trim() : "";
    const ar = arKey ? String(getVal(arKey) || "").trim() : "";
    const generic = genericKey ? String(getVal(genericKey) || "").trim() : "";
    
    if (!fa && !en && !ar && !generic) return undefined;
    
    return {
      fa: fa || generic || existing.name.fa,
      en: en || generic || existing.name.en,
      ar: ar || generic || existing.name.ar,
    };
  };
  
  const name = getLocalized(mapping.nameFa, mapping.nameEn, mapping.nameAr, mapping.name) || existing.name;
  const description = getLocalized(mapping.descriptionFa, mapping.descriptionEn, mapping.descriptionAr, mapping.description) || existing.description;
  
  const priceVal = getVal(mapping.price);
  const price = priceVal != null && priceVal !== "" ? Number(priceVal) : existing.price;
  
  const oldPriceVal = getVal(mapping.oldPrice);
  const oldPrice = oldPriceVal != null && oldPriceVal !== "" ? Number(oldPriceVal) : existing.oldPrice;
  
  const quantityVal = getVal(mapping.quantity);
  const quantity = quantityVal != null && quantityVal !== "" ? Number(quantityVal) : existing.quantity;
  
  const packQuantityVal = getVal(mapping.packQuantity);
  const packQuantity = packQuantityVal != null && packQuantityVal !== "" ? Number(packQuantityVal) : existing.packQuantity;
  
  const categoryVal = getVal(mapping.category) || getVal(mapping.categoryId);
  const categoryId = categoryVal ? resolveCategoryId(String(categoryVal)) : existing.categoryId;
  
  const imageVal = getVal(mapping.image);
  const image = imageVal ? String(imageVal) : existing.image;
  
  const inStockVal = getVal(mapping.inStock);
  let inStock = existing.inStock;
  if (inStockVal != null && inStockVal !== "") {
    if (typeof inStockVal === "boolean") inStock = inStockVal;
    else if (typeof inStockVal === "string") {
      const lower = inStockVal.toLowerCase();
      inStock = lower === "true" || lower === "1" || lower === "موجود" || lower === "yes";
    } else if (typeof inStockVal === "number") {
      inStock = inStockVal > 0;
    }
  }
  
  return {
    ...existing,
    name,
    description,
    price: isNaN(price) ? existing.price : price,
    oldPrice: oldPrice != null && !isNaN(oldPrice) ? oldPrice : existing.oldPrice,
    quantity: quantity != null && !isNaN(quantity) ? quantity : existing.quantity,
    packQuantity: packQuantity != null && !isNaN(packQuantity) ? packQuantity : existing.packQuantity,
    categoryId,
    image,
    inStock,
    // Preserve KalaSearch-only fields: do NOT overwrite ashkanProductUrl unless provided
    ashkanProductUrl: getVal(mapping.ashkanProductUrl) ? String(getVal(mapping.ashkanProductUrl)) : existing.ashkanProductUrl,
  };
}

/**
 * Create new product from Excel row
 * Returns null if essential data missing (no fake product creation)
 */
function createProductFromExcelRow(row: ExcelRow, mapping: ExcelColumnMapping): Product | null {
  const getVal = (key?: string) => key ? row[key] : undefined;
  
  const idVal = getVal(mapping.id) || getVal("id");
  const nameVal = getVal(mapping.nameFa) || getVal(mapping.name) || getVal(mapping.nameEn);
  const priceVal = getVal(mapping.price);
  
  // Essential fields check - no fake product if missing
  if (!idVal || !nameVal || priceVal == null || priceVal === "") {
    return null;
  }
  
  const id = String(idVal).trim();
  const slug = String(getVal(mapping.slug) || id).trim().toLowerCase().replace(/\s+/g, "-");
  const price = Number(priceVal);
  
  if (isNaN(price)) return null;
  
  const nameText = String(nameVal).trim();
  const name: LocalizedText = {
    fa: String(getVal(mapping.nameFa) || nameText),
    en: String(getVal(mapping.nameEn) || nameText),
    ar: String(getVal(mapping.nameAr) || nameText),
  };
  
  const descText = String(getVal(mapping.descriptionFa) || getVal(mapping.description) || nameText);
  const description: LocalizedText = {
    fa: String(getVal(mapping.descriptionFa) || descText),
    en: String(getVal(mapping.descriptionEn) || descText),
    ar: String(getVal(mapping.descriptionAr) || descText),
  };
  
  const categoryVal = getVal(mapping.category) || getVal(mapping.categoryId);
  const categoryId = categoryVal ? resolveCategoryId(String(categoryVal)) : "others";
  
  const quantityVal = getVal(mapping.quantity);
  const packQuantityVal = getVal(mapping.packQuantity);
  
  return {
    id,
    slug,
    name,
    description,
    features: [],
    categoryId,
    price,
    oldPrice: getVal(mapping.oldPrice) ? Number(getVal(mapping.oldPrice)) : undefined,
    image: String(getVal(mapping.image) || "/images/product-storage-set.jpg"),
    inStock: true,
    stockCount: 0,
    quantity: quantityVal != null ? Number(quantityVal) : undefined,
    packQuantity: packQuantityVal != null ? Number(packQuantityVal) : undefined,
    sku: getVal(mapping.sku) ? String(getVal(mapping.sku)) : undefined,
    externalId: getVal(mapping.externalId) ? String(getVal(mapping.externalId)) : undefined,
    ashkanId: getVal(mapping.ashkanId) ? String(getVal(mapping.ashkanId)) : undefined,
    ashkanProductUrl: getVal(mapping.ashkanProductUrl) ? String(getVal(mapping.ashkanProductUrl)) : "",
  };
}

/**
 * Get final product list after merge (for Search compatibility)
 * This is what Search will use - final merged data
 */
export function getFinalProductsAfterMerge(results: ImportResult[]): Product[] {
  return results
    .filter(r => r.action !== "skip")
    .map(r => r.product);
}

/**
 * Validate Excel file structure (without importing)
 */
export function validateExcelStructure(rows: ExcelRow[], mapping: ExcelColumnMapping): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: { total: number; withId: number; withName: number; withPrice: number };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let withId = 0, withName = 0, withPrice = 0;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const hasId = !!(row[mapping.id || ""] || row["id"]);
    const hasName = !!(row[mapping.nameFa || ""] || row[mapping.name || ""] || row[mapping.nameEn || ""]);
    const hasPrice = !!(row[mapping.price || ""] || row["price"]);
    
    if (hasId) withId++;
    if (hasName) withName++;
    if (hasPrice) withPrice++;
    
    if (!hasId) warnings.push(`Row ${i+1}: Missing ID/Code`);
    if (!hasName) errors.push(`Row ${i+1}: Missing Name`);
    if (!hasPrice) warnings.push(`Row ${i+1}: Missing Price`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { total: rows.length, withId, withName, withPrice },
  };
}
