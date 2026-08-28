import productCsv from "../../KalaSearch_Products_Import.csv?raw";
import categoryCsv from "../../KalaSearch_Categories.csv?raw";
import ashkanCsv from "../../KalaSearch_Ashkan_Links.csv?raw";
import type { Category, LocalizedText, Product, ProductVariation } from "../types";

export interface ProductSourceRow { [key: string]: string; }

function parseCsv(input: string): ProductSourceRow[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() ?? []).map((h) => h.replace(/^\uFEFF/, "").trim());
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])));
}

const productsRows = parseCsv(productCsv);
const ashkanRows = parseCsv(ashkanCsv);
const categoryRows = parseCsv(categoryCsv);
const numberOrUndefined = (value?: string) => {
  const n = Number(value ?? "");
  return value?.trim() && Number.isFinite(n) ? n : undefined;
};
const localized = (value: string): LocalizedText => ({ fa: value, en: value, ar: value });

const ashkanByVariantSku = new Map(ashkanRows.map((row) => [row["کد"], row]));
const mergedRows: ProductSourceRow[] = productsRows.map((source) => {
  const ashkan = ashkanByVariantSku.get(source.variant_sku);
  return {
    ...source,
    ...(ashkan ? {
      variant_name: ashkan["عنوان"] || source.variant_name,
      technical_spec: ashkan["مشخصه فنی"] || source.technical_spec,
      stock: ashkan["مانده (اصلی)"] || source.stock,
      pack_quantity: ashkan["تعداد در بسته"] || source.pack_quantity,
      ashkan_url: ashkan["آدرس"] || source.ashkan_url,
    } : {}),
  };
});

const categoryNames = categoryRows.sort((a, b) => Number(a.sort_order) - Number(b.sort_order)).map((row) => row.category_name).filter(Boolean);
const primaryNames = categoryNames.length >= 8 ? categoryNames.slice(0, 8).concat("سایر") : [
  "سبد خرید", "سبد پیکنیک", "چهار پایه", "جا پودری/اسکاجی", "سبد میوه و سبزی", "آبکش و سبد و کاسه", "فریزری", "جاصابونی", "سایر",
];
const categoryMatchers: [string, string[]][] = [
  ["shopping-basket", ["سبد خرید"]], ["picnic-basket", ["پیکنیک"]], ["stool", ["چهار پایه", "چهارپایه"]],
  ["powder-sponge-holder", ["پودری", "اسکاج"]], ["fruit-vegetable-basket", ["میوه", "سبزی"]],
  ["colander-bowl", ["آبکش", "کاسه"]], ["freezer", ["فریزری", "فریز"]], ["soap-dish", ["صابونی"]],
];
function categoryIdFor(name: string) {
  if (/جا کره‌ای|جا قاشقی|گلدان/.test(name)) return "other";
  return categoryMatchers.find(([, words]) => words.some((word) => name.includes(word)))?.[0] ?? "other";
}
const icons = ["🛒", "🧺", "🪑", "🧽", "🍎", "🥣", "❄️", "🧼", "📦"];
export const importedCategories: Category[] = primaryNames.map((name, index) => ({
  id: index === 8 ? "other" : categoryMatchers[index]?.[0] ?? `category-${index + 1}`,
  name: localized(name), icon: icons[index], sortOrder: index + 1,
}));

const colorTokens: Record<string, string> = {
  "صورتی": "#f9a8d4", "طوسی": "#94a3b8", "کرم": "#d6c7a1", "موکا": "#8b6f5a", "وانیلی": "#f3e5ab",
  "سفید": "#f8fafc", "قرمز": "#ef4444", "سبز": "#22c55e", "آبی": "#3b82f6", "مشکی": "#111827",
  "زرد": "#eab308", "نارنجی": "#f97316", "بنفش": "#a855f7",
};
function extractColor(value: string) {
  const token = Object.keys(colorTokens).find((name) => value.includes(name));
  return token ? colorTokens[token] : undefined;
}

function toVariation(row: ProductSourceRow): ProductVariation {
  return {
    id: row.variant_sku,
    name: localized(row.variant_name || row.product_name),
    color: extractColor(row.variant_name || ""),
    sku: row.variant_sku || undefined,
    price: numberOrUndefined(row.price),
    image: row.main_image || row.image_1 || row.image_2 || undefined,
    stockCount: numberOrUndefined(row.stock),
    packQuantity: numberOrUndefined(row.pack_quantity),
    inStock: row.availability === "موجود",
    url: row.ashkan_url || undefined,
    technicalSpec: row.technical_spec || undefined,
  };
}

export const importedProducts: Product[] = Array.from(new Set(mergedRows.map((row) => row.product_id))).map((productId) => {
  const rows = mergedRows.filter((row) => row.product_id === productId);
  const first = rows[0];
  const variations = rows.map(toVariation);
  return {
    id: productId,
    slug: productId,
    name: localized(first.product_name),
    description: localized(first.technical_spec || ""),
    features: rows.filter((row) => row.technical_spec && row.technical_spec !== "-").map((row) => localized(row.technical_spec)),
    categoryId: categoryIdFor(first.product_name),
    price: numberOrUndefined(first.price),
    image: first.main_image || first.image_1 || first.image_2 || "",
    gallery: [first.image_1, first.image_2].filter(Boolean),
    inStock: rows.some((row) => row.availability === "موجود"),
    stockCount: numberOrUndefined(first.stock),
    packQuantity: numberOrUndefined(first.pack_quantity),
    sku: first.variant_sku || undefined,
    productCode: productId,
    brand: undefined,
    ashkanProductUrl: first.ashkan_url || undefined,
    variants: variations,
    variations,
    sourceRows: rows,
  };
});

export const importedSourceStats = {
  rows: mergedRows.length,
  products: importedProducts.length,
  variants: mergedRows.length,
  available: mergedRows.filter((row) => row.availability === "موجود").length,
  unavailable: mergedRows.filter((row) => row.availability === "ناموجود").length,
  matchedAshkanRows: mergedRows.filter((row) => ashkanByVariantSku.has(row.variant_sku)).length,
};

export function getImportedProductById(id: string) { return importedProducts.find((product) => product.id === id); }
export function getImportedProductsByCategory(categoryId: string) { return importedProducts.filter((product) => product.categoryId === categoryId); }
export function searchImportedProducts(query: string) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  return importedProducts.filter((p) => [p.name.fa, p.productCode, p.sku, p.categoryId, importedCategories.find((c) => c.id === p.categoryId)?.name.fa, p.description.fa, ...(p.variants ?? []).flatMap((v) => [v.name.fa, v.sku, v.technicalSpec])].filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(q)));
}
