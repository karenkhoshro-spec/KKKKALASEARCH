import productCsv from "../../KalaSearch_Products_Import.csv?raw";
import categoryCsv from "../../KalaSearch_Categories.csv?raw";
import ashkanCsv from "../../KalaSearch_Ashkan_Links.csv?raw";
import inventoryCsv from "../../kala_search_inventory.csv?raw";
import type { Category, LocalizedText, Product, ProductVariation } from "../types";

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
export const parsePrice = (value?: string) => { const normalized = (value ?? "").replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٬,\s]/g, ""); const n = Number(normalized); return normalized && Number.isFinite(n) && n > 0 ? n : undefined; };
const numberOrUndefined = (value?: string) => { const n = Number(value ?? ""); return value?.trim() && Number.isFinite(n) ? n : undefined; };
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
const mergedRows: ProductSourceRow[] = productsRows.map((source) => {
  const ashkan = ashkanByVariantSku.get(source.variant_sku);
  return { ...source, ...(ashkan ? {
    variant_name: ashkan["عنوان"] || source.variant_name,
    technical_spec: ashkan["مشخصه فنی"] || source.technical_spec,
    stock: ashkan["مانده (اصلی)"] || source.stock,
    pack_quantity: ashkan["تعداد در بسته"] || source.pack_quantity,
    ashkan_url: ashkan["آدرس"] || source.ashkan_url,
  } : {}) };
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
function toVariation(row: ProductSourceRow): ProductVariation { const color = extractColor(row.variant_name || ""); return { id: row.variant_sku, name: localized(row.variant_name || row.product_name), color: color?.hex, colorName: color?.name, sku: row.variant_sku || undefined, price: parsePrice(inventoryBySku.get(row.variant_sku)?.outbound_or_value), image: row.main_image || row.image_1 || row.image_2 || undefined, stockCount: numberOrUndefined(row.stock), packQuantity: numberOrUndefined(row.pack_quantity), inStock: row.availability === "موجود", url: row.ashkan_url || undefined, technicalSpec: row.technical_spec || undefined }; }

export const importedProducts: Product[] = Array.from(new Set(mergedRows.map((row) => row.product_id))).map((productId) => {
  const rows = mergedRows.filter((row) => row.product_id === productId); const first = rows[0]; const variations = rows.map(toVariation); const sub = otherSubcategory(first.product_name); const validPrices = variations.map((variation) => variation.price).filter((price): price is number => price !== undefined);
  return { id: productId, slug: productId, name: localized(first.product_name), description: localized(first.technical_spec || ""), features: rows.filter((row) => row.technical_spec && row.technical_spec !== "-").map((row) => localized(row.technical_spec)), categoryId: categoryIdFor(first.product_name), subcategoryId: sub.id, price: validPrices[0], image: first.main_image || first.image_1 || first.image_2 || "", gallery: [first.image_1, first.image_2].filter(Boolean), inStock: rows.some((row) => row.availability === "موجود"), stockCount: numberOrUndefined(first.stock), packQuantity: numberOrUndefined(first.pack_quantity), sku: first.variant_sku || undefined, productCode: productId, brand: undefined, ashkanProductUrl: first.ashkan_url || undefined, variants: variations, variations, sourceRows: rows };
});

const inventoryPriceValuesByProduct = new Map<string, Set<number>>();
for (const row of productsRows) { const price = parsePrice(inventoryBySku.get(row.variant_sku)?.outbound_or_value); if (price !== undefined) { const values = inventoryPriceValuesByProduct.get(row.product_id) ?? new Set<number>(); values.add(price); inventoryPriceValuesByProduct.set(row.product_id, values); } }
export const importedPriceStats = { totalInventoryRecords: inventoryRows.length, matched: importedProducts.filter((product) => importedPriceMappings.some((mapping) => mapping.matchedProduct === product.name.fa && mapping.matchStatus !== "unmatched")).length, unmatched: importedProducts.filter((product) => !importedPriceMappings.some((mapping) => mapping.matchedProduct === product.name.fa && mapping.matchStatus !== "unmatched")).length, fuzzyMatches: importedPriceMappings.filter((mapping) => mapping.matchStatus === "fuzzy").length, conflicts: Array.from(inventoryPriceValuesByProduct.values()).filter((values) => values.size > 1).length, invalidPrices: inventoryRows.filter((row) => parsePrice(row.outbound_or_value) === undefined).length, duplicateSkus: inventoryRows.length - new Set(inventoryRows.map((row) => row.sku_variant)).size };
export const importedSourceStats = { rows: mergedRows.length, products: importedProducts.length, variants: mergedRows.length, available: mergedRows.filter((row) => row.availability === "موجود").length, unavailable: mergedRows.filter((row) => row.availability === "ناموجود").length, matchedAshkanRows: mergedRows.filter((row) => ashkanByVariantSku.has(row.variant_sku)).length };
export function getImportedProductById(id: string) { return importedProducts.find((product) => product.id === id); }
export function getImportedProductsByCategory(categoryId: string, subcategoryId?: string) { return importedProducts.filter((product) => product.categoryId === categoryId && (!subcategoryId || product.subcategoryId === subcategoryId)); }
export function getImportedOtherSubcategoryCounts() { return importedOtherSubcategories.filter((sub) => importedProducts.some((product) => product.categoryId === "other" && product.subcategoryId === sub.id)).map((sub) => ({ ...sub, count: importedProducts.filter((product) => product.categoryId === "other" && product.subcategoryId === sub.id).length })); }
export function searchImportedProducts(query: string) { const q = query.trim().toLocaleLowerCase(); if (!q) return []; return importedProducts.filter((p) => [p.name.fa, p.productCode, p.sku, p.categoryId, p.subcategoryId, importedCategories.find((c) => c.id === p.categoryId)?.name.fa, p.description.fa, ...(p.variants ?? []).flatMap((v) => [v.name.fa, v.sku, v.technicalSpec])].filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(q))); }
