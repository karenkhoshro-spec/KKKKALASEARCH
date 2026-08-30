import productCsv from "../../KalaSearch_Products_Import.csv?raw";
import categoryCsv from "../../KalaSearch_Categories.csv?raw";
import ashkanCsv from "../../KalaSearch_Ashkan_Links.csv?raw";
import inventoryCsv from "../../kala_search_inventory.csv?raw";
import type { Category, LocalizedText, Product, ProductVariation } from "../types";
import productImagesRaw from "./productImages.json";
import { isValidImageUrl } from "./productImageResolver";

export interface ProductSourceRow { [key: string]: string; }

function parseCsv(input: string): ProductSourceRow[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') { if (quoted && input[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell); cell = ""; if (row.some((v) => v.trim())) rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() ?? []).map((h) => h.replace(/^\uFEFF/, "").trim());
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])));
}

const productsRows = parseCsv(productCsv);
const ashkanRows = parseCsv(ashkanCsv);
const inventoryRows = parseCsv(inventoryCsv);
const categoryRows = parseCsv(categoryCsv);

export const normalizePersian = (value: string) => value.normalize("NFKC").replace(/[يى]/g, "ی").replace(/[ك]/g, "ک").replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[\u200c\u200f\u200e]/g, "").replace(/[^\p{L}\p{N}]+/gu, "").toLocaleLowerCase();

/**
 * Enhanced Persian normalization for product name matching per spec:
 * - ي → ی, ك → ک
 * - Persian/English digits normalized
 * - trim, extra spaces removed, ZWNJ normalized, Unicode NFKC, lowercase
 * This version keeps spaces as single space for display matching, but for key matching we use normalizePersian which strips non-alnum.
 * For URL mapping we use normalizePersian as primary key to be consistent with existing tests.
 */
export const normalizeProductName = (value: string): string => {
  return value
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[\u200c\u200f\u200e\u200b]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
};

export const parsePrice = (value?: string) => { const normalized = (value ?? "").replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٬,\s]/g, ""); const n = Number(normalized); return normalized && Number.isFinite(n) && n > 0 ? n : undefined; };
const numberOrUndefined = (value?: string) => { const n = Number(value ?? ""); return value?.trim() && Number.isFinite(n) ? n : undefined; };

// ------------------------------------------------------------------
// Existing price mapping structures (preserved for backward compat)
// ------------------------------------------------------------------
const inventoryBySku = new Map(inventoryRows.map((row) => [row.sku_variant, row]));
const inventoryNameByNormalized = new Map(inventoryRows.map((row) => [normalizePersian(row.product_name), row]));
export interface ImportedPriceMapping { productName: string; matchedProduct: string; price?: number; matchStatus: "exact" | "normalized-exact" | "fuzzy" | "unmatched"; confidence: number; sourceSku: string; }
export const importedPriceMappings: ImportedPriceMapping[] = productsRows.map((row) => {
  const inventory = inventoryBySku.get(row.variant_sku) ?? inventoryNameByNormalized.get(normalizePersian(row.variant_name));
  const exactIdentity = inventory?.sku_variant === row.variant_sku && inventory?.product_code === row.product_id;
  const normalizedName = inventory && normalizePersian(inventory.product_name) === normalizePersian(row.variant_name);
  return { productName: row.product_name, matchedProduct: inventory?.product_code === row.product_id ? row.product_name : "", price: parsePrice(inventory?.outbound_or_value), matchStatus: exactIdentity ? "exact" : normalizedName ? "normalized-exact" : "unmatched", confidence: exactIdentity ? 1 : normalizedName ? 0.99 : 0, sourceSku: inventory?.sku_variant ?? "" };
});
const localized = (value: string): LocalizedText => ({ fa: value, en: value, ar: value });
const ashkanByVariantSku = new Map(ashkanRows.map((row) => [row["کد"], row]));

// ------------------------------------------------------------------
// URL VALIDATION per spec
// ------------------------------------------------------------------
export function isValidProductUrl(raw: string | undefined | null): boolean {
  if (raw === undefined || raw === null) return false;
  const trimmed = String(raw).trim();
  if (!trimmed) return false;
  if (/^(javascript|data|blob):/i.test(trimmed)) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeUrl(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (!isValidProductUrl(trimmed)) return undefined;
  return trimmed;
}

function normalizeUrlForComparison(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

// ------------------------------------------------------------------
// PRODUCT IMAGE MAPPING — built from productImages.json (offline extraction
// of each product's own Ashkan page; validated before use, never substituted).
// ------------------------------------------------------------------
const productImageMap = new Map<string, string>();
for (const [key, rawUrl] of Object.entries(productImagesRaw as Record<string, string>)) {
  const trimmed = rawUrl?.trim();
  if (trimmed && isValidImageUrl(trimmed)) {
    productImageMap.set(key.trim(), trimmed);
  }
}

function resolveProductImageUrl(productId: string, variantSkus: string[]): string | undefined {
  // Priority: product_id direct, then first variant SKU that has image
  if (productImageMap.has(productId)) {
    const url = productImageMap.get(productId);
    if (url && isValidImageUrl(url)) return url;
  }
  for (const sku of variantSkus) {
    if (productImageMap.has(sku)) {
      const url = productImageMap.get(sku);
      if (url && isValidImageUrl(url)) return url;
    }
  }
  return undefined;
}

// ------------------------------------------------------------------
// BUILD URL MAPS FROM ALL CSV SOURCES
// ------------------------------------------------------------------
// Inventory maps
const inventorySkuToUrl = new Map<string, string>();
const inventoryProductCodeToUrls = new Map<string, Set<string>>();
const inventoryProductCodeToUrl = new Map<string, string>();
const inventoryNormalizedNameToUrls = new Map<string, Set<string>>();
const inventoryNormalizedNameToUrl = new Map<string, string>();
const inventoryNormalizedNameToProductCodes = new Map<string, Set<string>>();

for (const row of inventoryRows) {
  const sku = row.sku_variant?.trim();
  const code = row.product_code?.trim();
  const rawUrl = row.product_url?.trim();
  const name = row.product_name?.trim() ?? "";
  const normalizedName = normalizePersian(name);
  const validUrl = sanitizeUrl(rawUrl);

  if (sku && validUrl) {
    inventorySkuToUrl.set(sku, validUrl);
  }
  if (code && validUrl) {
    if (!inventoryProductCodeToUrls.has(code)) inventoryProductCodeToUrls.set(code, new Set());
    inventoryProductCodeToUrls.get(code)!.add(validUrl);
  }
  if (normalizedName) {
    if (!inventoryNormalizedNameToProductCodes.has(normalizedName)) inventoryNormalizedNameToProductCodes.set(normalizedName, new Set());
    if (code) inventoryNormalizedNameToProductCodes.get(normalizedName)!.add(code);
    if (validUrl) {
      if (!inventoryNormalizedNameToUrls.has(normalizedName)) inventoryNormalizedNameToUrls.set(normalizedName, new Set());
      inventoryNormalizedNameToUrls.get(normalizedName)!.add(validUrl);
    }
  }
}
// Resolve product_code -> single URL if not ambiguous
for (const [code, urls] of inventoryProductCodeToUrls) {
  if (urls.size === 1) {
    inventoryProductCodeToUrl.set(code, [...urls][0]);
  } else {
    // If multiple distinct URLs for same code, check if they are actually same after normalization
    const normalized = new Set([...urls].map(normalizeUrlForComparison));
    if (normalized.size === 1) {
      inventoryProductCodeToUrl.set(code, [...urls][0]);
    }
    // else ambiguous -> do not set, will be tracked as ambiguous
  }
}
for (const [norm, urls] of inventoryNormalizedNameToUrls) {
  if (urls.size === 1) {
    const codes = inventoryNormalizedNameToProductCodes.get(norm);
    // If same normalized name maps to multiple product codes -> ambiguous
    if (!codes || codes.size <= 1) {
      inventoryNormalizedNameToUrl.set(norm, [...urls][0]);
    }
  } else {
    const normalized = new Set([...urls].map(normalizeUrlForComparison));
    if (normalized.size === 1) {
      const codes = inventoryNormalizedNameToProductCodes.get(norm);
      if (!codes || codes.size <= 1) {
        inventoryNormalizedNameToUrl.set(norm, [...urls][0]);
      }
    }
  }
}

// Ashkan maps
const ashkanSkuToUrl = new Map<string, string>();
const ashkanProductCodeToUrls = new Map<string, Set<string>>();
const ashkanProductCodeToUrl = new Map<string, string>();
const ashkanNormalizedTitleToUrls = new Map<string, Set<string>>();
const ashkanNormalizedTitleToUrl = new Map<string, string>();
const ashkanNormalizedTitleToProductCodes = new Map<string, Set<string>>();

for (const row of ashkanRows) {
  const sku = row["کد"]?.trim();
  const code = row["کد.1"]?.trim();
  const rawUrl = row["آدرس"]?.trim();
  const title = row["عنوان"]?.trim() ?? "";
  const normalizedTitle = normalizePersian(title);
  const validUrl = sanitizeUrl(rawUrl);

  if (sku && validUrl) ashkanSkuToUrl.set(sku, validUrl);
  if (code && validUrl) {
    if (!ashkanProductCodeToUrls.has(code)) ashkanProductCodeToUrls.set(code, new Set());
    ashkanProductCodeToUrls.get(code)!.add(validUrl);
  }
  if (normalizedTitle) {
    if (!ashkanNormalizedTitleToProductCodes.has(normalizedTitle)) ashkanNormalizedTitleToProductCodes.set(normalizedTitle, new Set());
    if (code) ashkanNormalizedTitleToProductCodes.get(normalizedTitle)!.add(code);
    if (validUrl) {
      if (!ashkanNormalizedTitleToUrls.has(normalizedTitle)) ashkanNormalizedTitleToUrls.set(normalizedTitle, new Set());
      ashkanNormalizedTitleToUrls.get(normalizedTitle)!.add(validUrl);
    }
  }
}
for (const [code, urls] of ashkanProductCodeToUrls) {
  if (urls.size === 1) ashkanProductCodeToUrl.set(code, [...urls][0]);
  else {
    const normalized = new Set([...urls].map(normalizeUrlForComparison));
    if (normalized.size === 1) ashkanProductCodeToUrl.set(code, [...urls][0]);
  }
}
for (const [norm, urls] of ashkanNormalizedTitleToUrls) {
  if (urls.size === 1) {
    const codes = ashkanNormalizedTitleToProductCodes.get(norm);
    if (!codes || codes.size <= 1) ashkanNormalizedTitleToUrl.set(norm, [...urls][0]);
  } else {
    const normalized = new Set([...urls].map(normalizeUrlForComparison));
    if (normalized.size === 1) {
      const codes = ashkanNormalizedTitleToProductCodes.get(norm);
      if (!codes || codes.size <= 1) ashkanNormalizedTitleToUrl.set(norm, [...urls][0]);
    }
  }
}

// Products import maps
const productsIdToUrls = new Map<string, Set<string>>();
const productsIdToUrl = new Map<string, string>();
const productsSkuToUrl = new Map<string, string>();
const productsNormalizedNameToUrls = new Map<string, Set<string>>();
const productsNormalizedNameToUrl = new Map<string, string>();
const productsNormalizedNameToIds = new Map<string, Set<string>>();

for (const row of productsRows) {
  const id = row.product_id?.trim();
  const sku = row.variant_sku?.trim();
  const rawUrl = row.ashkan_url?.trim();
  const name = row.product_name?.trim() ?? "";
  const normalizedName = normalizePersian(name);
  const validUrl = sanitizeUrl(rawUrl);

  if (id && validUrl) {
    if (!productsIdToUrls.has(id)) productsIdToUrls.set(id, new Set());
    productsIdToUrls.get(id)!.add(validUrl);
  }
  if (sku && validUrl) productsSkuToUrl.set(sku, validUrl);
  if (normalizedName) {
    if (!productsNormalizedNameToIds.has(normalizedName)) productsNormalizedNameToIds.set(normalizedName, new Set());
    if (id) productsNormalizedNameToIds.get(normalizedName)!.add(id);
    if (validUrl) {
      if (!productsNormalizedNameToUrls.has(normalizedName)) productsNormalizedNameToUrls.set(normalizedName, new Set());
      productsNormalizedNameToUrls.get(normalizedName)!.add(validUrl);
    }
  }
}
for (const [id, urls] of productsIdToUrls) {
  if (urls.size === 1) productsIdToUrl.set(id, [...urls][0]);
  else {
    const normalized = new Set([...urls].map(normalizeUrlForComparison));
    if (normalized.size === 1) productsIdToUrl.set(id, [...urls][0]);
  }
}
for (const [norm, urls] of productsNormalizedNameToUrls) {
  if (urls.size === 1) {
    const ids = productsNormalizedNameToIds.get(norm);
    if (!ids || ids.size <= 1) productsNormalizedNameToUrl.set(norm, [...urls][0]);
  } else {
    const normalized = new Set([...urls].map(normalizeUrlForComparison));
    if (normalized.size === 1) {
      const ids = productsNormalizedNameToIds.get(norm);
      if (!ids || ids.size <= 1) productsNormalizedNameToUrl.set(norm, [...urls][0]);
    }
  }
}

// ------------------------------------------------------------------
// AMBIGUOUS DETECTION
// ------------------------------------------------------------------
const ambiguousProductCodes = new Set<string>();
for (const [code, urls] of inventoryProductCodeToUrls) {
  if (urls.size > 1) {
    const normSet = new Set([...urls].map(normalizeUrlForComparison));
    if (normSet.size > 1) ambiguousProductCodes.add(code);
  }
}
for (const [code, urls] of ashkanProductCodeToUrls) {
  if (urls.size > 1) {
    const normSet = new Set([...urls].map(normalizeUrlForComparison));
    if (normSet.size > 1) ambiguousProductCodes.add(code);
  }
}
for (const [code, urls] of productsIdToUrls) {
  if (urls.size > 1) {
    const normSet = new Set([...urls].map(normalizeUrlForComparison));
    if (normSet.size > 1) ambiguousProductCodes.add(code);
  }
}

const ambiguousNormalizedNames = new Set<string>();
for (const [norm, codes] of inventoryNormalizedNameToProductCodes) {
  if (codes.size > 1) ambiguousNormalizedNames.add(norm);
}
for (const [norm, codes] of ashkanNormalizedTitleToProductCodes) {
  if (codes.size > 1) ambiguousNormalizedNames.add(norm);
}
for (const [norm, ids] of productsNormalizedNameToIds) {
  if (ids.size > 1) ambiguousNormalizedNames.add(norm);
}
for (const [norm, urls] of inventoryNormalizedNameToUrls) {
  if (urls.size > 1) {
    const normSet = new Set([...urls].map(normalizeUrlForComparison));
    if (normSet.size > 1) ambiguousNormalizedNames.add(norm);
  }
}
for (const [norm, urls] of ashkanNormalizedTitleToUrls) {
  if (urls.size > 1) {
    const normSet = new Set([...urls].map(normalizeUrlForComparison));
    if (normSet.size > 1) ambiguousNormalizedNames.add(norm);
  }
}
for (const [norm, urls] of productsNormalizedNameToUrls) {
  if (urls.size > 1) {
    const normSet = new Set([...urls].map(normalizeUrlForComparison));
    if (normSet.size > 1) ambiguousNormalizedNames.add(norm);
  }
}

// ------------------------------------------------------------------
// PRODUCT URL RESOLUTION WITH PRIORITY: product_id > product_code > SKU > normalized name
// ------------------------------------------------------------------
function resolveProductUrlFromMaps(productId: string, variantSkus: string[], productName: string): string | undefined {
  const normalizedName = normalizePersian(productName);
  const isAmbiguousName = ambiguousNormalizedNames.has(normalizedName);

  // Priority 1: product_id / product_code
  // inventory
  if (inventoryProductCodeToUrl.has(productId)) return inventoryProductCodeToUrl.get(productId);
  if (ashkanProductCodeToUrl.has(productId)) return ashkanProductCodeToUrl.get(productId);
  if (productsIdToUrl.has(productId)) return productsIdToUrl.get(productId);

  // Priority 3: SKU (variant SKUs)
  for (const sku of variantSkus) {
    if (!sku) continue;
    if (inventorySkuToUrl.has(sku)) return inventorySkuToUrl.get(sku);
    if (ashkanSkuToUrl.has(sku)) return ashkanSkuToUrl.get(sku);
    if (productsSkuToUrl.has(sku)) return productsSkuToUrl.get(sku);
  }

  // Priority 4: normalized product_name (only if not ambiguous)
  if (!isAmbiguousName) {
    if (inventoryNormalizedNameToUrl.has(normalizedName)) return inventoryNormalizedNameToUrl.get(normalizedName);
    if (ashkanNormalizedTitleToUrl.has(normalizedName)) return ashkanNormalizedTitleToUrl.get(normalizedName);
    if (productsNormalizedNameToUrl.has(normalizedName)) return productsNormalizedNameToUrl.get(normalizedName);
  }

  return undefined;
}

function resolveVariantUrl(variantSku: string, productId: string, variantName: string): string | undefined {
  const normalizedVariantName = normalizePersian(variantName);
  const isAmbiguousVariantName = ambiguousNormalizedNames.has(normalizedVariantName);

  if (variantSku) {
    if (inventorySkuToUrl.has(variantSku)) return inventorySkuToUrl.get(variantSku);
    if (ashkanSkuToUrl.has(variantSku)) return ashkanSkuToUrl.get(variantSku);
    if (productsSkuToUrl.has(variantSku)) return productsSkuToUrl.get(variantSku);
  }
  if (productId) {
    if (inventoryProductCodeToUrl.has(productId)) return inventoryProductCodeToUrl.get(productId);
    if (ashkanProductCodeToUrl.has(productId)) return ashkanProductCodeToUrl.get(productId);
    if (productsIdToUrl.has(productId)) return productsIdToUrl.get(productId);
  }
  if (!isAmbiguousVariantName) {
    if (inventoryNormalizedNameToUrl.has(normalizedVariantName)) return inventoryNormalizedNameToUrl.get(normalizedVariantName);
    if (ashkanNormalizedTitleToUrl.has(normalizedVariantName)) return ashkanNormalizedTitleToUrl.get(normalizedVariantName);
    if (productsNormalizedNameToUrl.has(normalizedVariantName)) return productsNormalizedNameToUrl.get(normalizedVariantName);
  }
  return undefined;
}

// ------------------------------------------------------------------
// MERGED ROWS - now also merges inventory product_url
// ------------------------------------------------------------------
const mergedRows: ProductSourceRow[] = productsRows.map((source) => {
  const ashkan = ashkanByVariantSku.get(source.variant_sku);
  const inventory = inventoryBySku.get(source.variant_sku);
  return {
    ...source,
    ...(ashkan
      ? {
          variant_name: ashkan["عنوان"] || source.variant_name,
          technical_spec: ashkan["مشخصه فنی"] || source.technical_spec,
          stock: ashkan["مانده (اصلی)"] || source.stock,
          pack_quantity: ashkan["تعداد در بسته"] || source.pack_quantity,
          ashkan_url: ashkan["آدرس"] || inventory?.product_url || source.ashkan_url,
        }
      : inventory
        ? {
            ashkan_url: inventory.product_url || source.ashkan_url,
          }
        : {}),
  };
});

const categoryNames = categoryRows.sort((a, b) => Number(a.sort_order) - Number(b.sort_order)).map((row) => row.category_name).filter(Boolean);
const primaryNames = categoryNames.length >= 8 ? categoryNames.slice(0, 8).concat("سایر") : ["سبد خرید", "سبد پیکنیک", "چهار پایه", "جا پودری/اسکاجی", "سبد میوه و سبزی", "آبکش و سبد و کاسه", "فریزری", "جاصابونی", "سایر"];
const primaryMatchers: [string, string[]][] = [
  ["shopping-basket", ["سبد خرید"]], ["picnic-basket", ["پیک نیک", "پیکنیک"]], ["stool", ["چهار پایه", "چهارپایه"]],
  ["powder-sponge-holder", ["پودری", "اسکاج", "اسکاچ"]], ["fruit-vegetable-basket", ["میوه", "سبزی"]],
  ["colander-bowl", ["آبکش", "کاسه", "سبد سینک"]], ["freezer", ["فریزری", "فریزری"]], ["soap-dish", ["صابونی"]],
];
const otherRules: [string, string, string[]][] = [
  ["spice", "جا ادویه", ["ادویه"]], ["pitcher-glass", "پارچ و لیوان", ["پارچ", "لیوان"]], ["juicer", "آبمیوه گیری", ["آبمیوه گیری", "آبمیوه"]],
  ["ice-holder", "جا یخی", ["جایخی", "جا یخی"]], ["butter-holder", "جا کره‌ای", ["جا کره ای", "جا کره‌ای"]], ["spoon-holder", "جا قاشقی", ["جا قاشقی", "جاقاشقی"]],
  ["bucket", "سطل", ["سطل", "درب سطل"]], ["basin-bathtub", "لگن و وان", ["لگن", "وان"]], ["plant-saucer", "زیر گلدان", ["زیر گلدان"]], ["flower-pot", "گلدان", ["گلدان"]],
  ["shopping-basket-other", "زنبیل", ["زنبیل"]], ["oval-basket", "سبد بیضی", ["سبد بیضی"]], ["janani", "جانانی", ["جانانی"]], ["organizer", "سبد و نظم‌دهنده", ["نظم دهنده", "نظم‌دهنده", "باکس", "جعبه نظم", "جعبه همه کاره", "فایل", "لوازم التحریر"]],
  ["laundry-basket", "سبد رخت و لباس", ["سبد رخت", "سبدرخت"]], ["kitchen-tools", "لوازم آشپزخانه", ["تخته گوشت", "پیمانه", "قندان", "شکرپاش", "جاشکری", "نمکدان", "نمکپاش", "قیف", "صافی سینک", "سبد سینک", "تفاله گیر", "جا تخم مرغی", "سرویس چلو"]],
  ["cleaning-tools", "لوازم نظافت", ["جارو دستی", "خاک انداز", "بادبزن", "مگس کش", "توالت شوی", "پادری"]], ["storage", "ظروف و نگهدارنده", ["حبوبات", "جابرنجی", "ظرف", "کریستال", "جامایع", "چند منظوره"]],
  ["tray", "سینی", ["سینی"]], ["chair", "صندلی حمام", ["صندلی حمام"]], ["hanger", "لوازم آویز", ["گیره آویز"]], ["paper-holder", "جاحوله و کاغذی", ["کاغذی"]],
  ["toolbox", "جعبه ابزار", ["جعبه ابزار"]], ["straw-basket", "سبد نان", ["سبد نان", "سبد باگت"]],
];
function primaryCategory(name: string) { return primaryMatchers.find(([, words]) => words.some((word) => name.includes(word)))?.[0]; }
function otherSubcategory(name: string) {
  const primary = primaryCategory(name); if (primary) return { id: primary, label: primaryNames[primaryMatchers.findIndex(([id]) => id === primary)] };
  const match = otherRules.find(([, , words]) => words.some((word) => name.includes(word)));
  return match ? { id: match[0], label: match[1] } : { id: "other-misc", label: "سایر محصولات" };
}
function categoryIdFor(name: string) { return primaryCategory(name) ?? "other"; }

const icons = ["🛒", "🧺", "🪑", "🧽", "🍎", "🥣", "❄️", "🧼", "📦"];
export const importedCategories: Category[] = primaryNames.map((name, index) => ({ id: index === 8 ? "other" : primaryMatchers[index]?.[0] ?? `category-${index + 1}`, name: localized(name), icon: icons[index], sortOrder: index + 1 }));
export const importedOtherSubcategories = otherRules.map(([id, label]) => ({ id, name: localized(label) }));

const colorTokens: Record<string, string> = {
  "آبی روشن": "#60a5fa", "آبی تیره": "#1d4ed8", "سبز روشن": "#86efac", "سبز تیره": "#15803d", "قرمز روشن": "#f87171", "قرمز تیره": "#b91c1c", "قهوه‌ای": "#8b5e3c", "قهوه ای": "#8b5e3c", "سرمه‌ای": "#1e3a8a", "سرمه ای": "#1e3a8a", "نقره‌ای": "#cbd5e1", "نقره ای": "#cbd5e1", "بی‌رنگ": "#f8fafc", "بی رنگ": "#f8fafc", "صورتی": "#f9a8d4", "طوسی": "#94a3b8", "خاکستری": "#6b7280", "کرم": "#d6c7a1", "موکا": "#8b6f5a", "وانیلی": "#f3e5ab", "عسلی": "#d69e2e", "کرپ": "#d8c3a5", "سفید": "#f8fafc", "قرمز": "#ef4444", "سبز": "#22c55e", "آبی": "#3b82f6", "مشکی": "#111827", "سیاه": "#111827", "زرد": "#eab308", "نارنجی": "#f97316", "بنفش": "#a855f7", "شفاف": "#e2e8f0", "بژ": "#d6c7a1", "طلایی": "#d4a72c", "مسی": "#b87333"
};
function extractColor(value: string) { const token = Object.keys(colorTokens).sort((a, b) => b.length - a.length).find((name) => value.includes(name)); return token ? { name: token, hex: colorTokens[token] } : undefined; }

function toVariation(row: ProductSourceRow): ProductVariation {
  const color = extractColor(row.variant_name || "");
  const sku = row.variant_sku?.trim() ?? "";
  const productId = row.product_id?.trim() ?? "";
  const variantName = row.variant_name || row.product_name || "";
  // Resolve URL via priority logic, fallback to row.ashkan_url if still valid
  const resolvedUrl = resolveVariantUrl(sku, productId, variantName) || sanitizeUrl(row.ashkan_url);
  return {
    id: row.variant_sku,
    name: localized(row.variant_name || row.product_name),
    color: color?.hex,
    colorName: color?.name,
    sku: row.variant_sku || undefined,
    price: parsePrice(inventoryBySku.get(row.variant_sku)?.outbound_or_value),
    image: row.main_image || row.image_1 || row.image_2 || undefined,
    stockCount: numberOrUndefined(row.stock),
    packQuantity: numberOrUndefined(row.pack_quantity),
    inStock: row.availability === "موجود",
    url: resolvedUrl,
    technicalSpec: row.technical_spec || undefined
  };
}

const rowsByProductId = new Map<string, ProductSourceRow[]>();
for (const row of mergedRows) {
  const group = rowsByProductId.get(row.product_id);
  if (group) group.push(row);
  else rowsByProductId.set(row.product_id, [row]);
}

export const importedProducts: Product[] = Array.from(rowsByProductId.values()).map((rows) => {
  const first = rows[0];
  const productId = first.product_id;
  const variations = rows.map(toVariation);
  const sub = otherSubcategory(first.product_name);
  const validPrices = variations.map((variation) => variation.price).filter((price): price is number => price !== undefined);
  const variantSkus = rows.map(r => r.variant_sku).filter(Boolean);
  const resolvedProductUrl = resolveProductUrlFromMaps(productId, variantSkus, first.product_name) || sanitizeUrl(first.ashkan_url);
  const resolvedImageUrl = resolveProductImageUrl(productId, variantSkus);
  return {
    id: productId,
    slug: productId,
    name: localized(first.product_name),
    description: localized(first.technical_spec || ""),
    features: rows.filter((row) => row.technical_spec && row.technical_spec !== "-").map((row) => localized(row.technical_spec)),
    categoryId: categoryIdFor(first.product_name),
    subcategoryId: sub.id,
    price: validPrices[0],
    image: first.main_image || first.image_1 || first.image_2 || "",
    gallery: [first.image_1, first.image_2].filter(Boolean),
    inStock: rows.some((row) => row.availability === "موجود"),
    stockCount: numberOrUndefined(first.stock),
    packQuantity: numberOrUndefined(first.pack_quantity),
    sku: first.variant_sku || undefined,
    productCode: productId,
    brand: undefined,
    ashkanProductUrl: resolvedProductUrl,
    productUrl: resolvedProductUrl,
    productImageUrl: resolvedImageUrl,
    variants: variations,
    variations,
    sourceRows: rows
  };
});

const inventoryPriceValuesByProduct = new Map<string, Set<number>>();
for (const row of productsRows) { const price = parsePrice(inventoryBySku.get(row.variant_sku)?.outbound_or_value); if (price !== undefined) { const values = inventoryPriceValuesByProduct.get(row.product_id) ?? new Set<number>(); values.add(price); inventoryPriceValuesByProduct.set(row.product_id, values); } }
// Matched/unmatched product names are precomputed once (single pass over the
// price mappings) instead of scanning all mappings per product.
const priceMatchedProductNames = new Set(importedPriceMappings.filter((mapping) => mapping.matchStatus !== "unmatched").map((mapping) => mapping.productName));
export const importedPriceStats = { totalInventoryRecords: inventoryRows.length, matched: importedProducts.filter((product) => priceMatchedProductNames.has(product.name.fa)).length, unmatched: importedProducts.filter((product) => !priceMatchedProductNames.has(product.name.fa)).length, fuzzyMatches: importedPriceMappings.filter((mapping) => mapping.matchStatus === "fuzzy").length, conflicts: Array.from(inventoryPriceValuesByProduct.values()).filter((values) => values.size > 1).length, invalidPrices: inventoryRows.filter((row) => parsePrice(row.outbound_or_value) === undefined).length, duplicateSkus: inventoryRows.length - new Set(inventoryRows.map((row) => row.sku_variant)).size };
export const importedSourceStats = { rows: mergedRows.length, products: importedProducts.length, variants: mergedRows.length, available: mergedRows.filter((row) => row.availability === "موجود").length, unavailable: mergedRows.filter((row) => row.availability === "ناموجود").length, matchedAshkanRows: mergedRows.filter((row) => ashkanByVariantSku.has(row.variant_sku)).length };

export function getImportedProductById(id: string) { return importedProducts.find((product) => product.id === id); }
export function getImportedProductsByCategory(categoryId: string, subcategoryId?: string) { return importedProducts.filter((product) => product.categoryId === categoryId && (!subcategoryId || product.subcategoryId === subcategoryId)); }
export function getImportedOtherSubcategoryCounts() { return importedOtherSubcategories.filter((sub) => importedProducts.some((product) => product.categoryId === "other" && product.subcategoryId === sub.id)).map((sub) => ({ ...sub, count: importedProducts.filter((product) => product.categoryId === "other" && product.subcategoryId === sub.id).length })); }
// Category-name lookup is indexed once rather than scanned per product per keystroke.
const categoryNameById = new Map(importedCategories.map((category) => [category.id, category.name.fa]));

// Per-product search haystacks (lowercased + Persian-normalized variants),
// built lazily once and reused across every search — no repeated work per query.
interface SearchEntry { id: string; hay: string; norm: string; }
let searchHaystacks: SearchEntry[] | null = null;
function getSearchHaystacks(): SearchEntry[] {
  if (!searchHaystacks) {
    searchHaystacks = importedProducts.map((p) => {
      const hay = [p.name.fa, p.name.en, p.name.ar, p.productCode, p.sku, p.categoryId, p.subcategoryId, categoryNameById.get(p.categoryId) ?? "", p.description.fa, ...(p.variants ?? []).flatMap((v) => [v.name.fa, v.sku, v.technicalSpec, v.colorName]), ...(p.variations ?? []).flatMap((v) => [v.name.fa, v.sku, v.technicalSpec, v.colorName])]
        .filter(Boolean)
        .join("\u0000")
        .toLocaleLowerCase();
      return { id: p.id, hay, norm: normalizePersian(hay) };
    });
  }
  return searchHaystacks;
}

export function searchImportedProducts(query: string) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  const normalizedQuery = normalizePersian(q);
  const haystacks = getSearchHaystacks();
  // Exact/substring hit first; normalized Persian hit (ي/ك, digits, نیم‌فاصله) as fallback.
  const direct = haystacks.filter((entry) => entry.hay.includes(q));
  if (normalizedQuery.length > 0) {
    const seen = new Set(direct.map((entry) => entry.id));
    for (const entry of haystacks) {
      if (!seen.has(entry.id) && entry.norm.includes(normalizedQuery)) direct.push(entry);
    }
  }
  const byId = new Map(importedProducts.map((p) => [p.id, p]));
  return direct.map((entry) => byId.get(entry.id)!).filter(Boolean);
}
