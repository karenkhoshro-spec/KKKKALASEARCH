import productCsv from "../../KalaSearch_Products_Import.csv?raw";
import categoryCsv from "../../KalaSearch_Categories.csv?raw";
import type { Category, LocalizedText, Product, ProductVariation } from "../types";

export interface ProductSourceRow {
  [key: string]: string;
}

function parseCsv(input: string): ProductSourceRow[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
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

const rawRows = parseCsv(productCsv);
const categoryRows = parseCsv(categoryCsv);
const numberOrUndefined = (value: string) => {
  const n = Number(value);
  return value.trim() && Number.isFinite(n) ? n : undefined;
};
const localized = (value: string): LocalizedText => ({ fa: value, en: value, ar: value });

const categoryNames = categoryRows
  .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
  .map((row) => row.category_name)
  .filter(Boolean);
const primaryNames = categoryNames.length === 15 ? categoryNames : [
  "سبد خرید", "سبد پیکنیک", "چهار پایه", "جا پودری/اسکاجی", "سبد میوه و سبزی",
  "آبکش و سبد و کاسه", "فریزری", "جاصابونی", "جا ادویه", "پارچ و لیوان",
  "آبمیوه گیری", "جا یخی", "سطل", "لگن و وان", "سایر",
];
const categoryMatchers: [string, string[]][] = [
  ["shopping-basket", ["سبد خرید"]], ["picnic-basket", ["پیکنیک"]], ["stool", ["چهار پایه", "چهارپایه"]],
  ["powder-sponge-holder", ["پودری", "اسکاج"]], ["fruit-vegetable-basket", ["میوه", "سبزی"]],
  ["colander-bowl", ["آبکش", "کاسه"]], ["freezer", ["فریزری", "فریز"]], ["soap-dish", ["صابونی"]],
  ["spice-holder", ["ادویه"]], ["pitcher-glass", ["پارچ", "لیوان"]], ["juicer", ["آبمیوه", "آبمیوه گیری"]],
  ["ice-holder", ["یخی"]], ["bucket", ["سطل", "دلو"]], ["basin-bathtub", ["لگن", "وان"]],
];
function categoryIdFor(name: string) {
  if (/جا کره‌ای|جا قاشقی|گلدان/.test(name)) return "other";
  return categoryMatchers.find(([, words]) => words.some((word) => name.includes(word)))?.[0] ?? "other";
}
const icons = ["🛒", "🧺", "🪑", "🧽", "🍎", "🥣", "❄️", "🧼", "🧂", "🥤", "🧃", "🧊", "🪣", "🛁", "📦"];
export const importedCategories: Category[] = primaryNames.map((name, index) => ({
  id: index === 14 ? "other" : (categoryMatchers[index]?.[0] ?? `category-${index + 1}`),
  name: localized(name), icon: icons[index],
}));

function toVariation(row: ProductSourceRow): ProductVariation {
  return {
    id: row.variant_sku || `${row.product_id}-${row.variant_name}`,
    name: localized(row.variant_name || row.product_name),
    sku: row.variant_sku || undefined,
    stockCount: numberOrUndefined(row.stock),
    packQuantity: numberOrUndefined(row.pack_quantity || row.product_pack_quantity),
    inStock: row.availability === "موجود",
    url: row.ashkan_url || undefined,
    technicalSpec: row.technical_spec || undefined,
  };
}

export const importedProducts: Product[] = Array.from(new Set(rawRows.map((row) => row.product_id))).map((productId) => {
  const rows = rawRows.filter((row) => row.product_id === productId);
  const first = rows[0];
  const variations = rows.map(toVariation);
  const image = first.main_image || first.image_1 || first.image_2 || "";
  return {
    id: productId,
    slug: productId,
    name: localized(first.product_name),
    description: localized(first.technical_spec || ""),
    features: first.technical_spec ? [localized(first.technical_spec)] : [],
    categoryId: categoryIdFor(first.product_name),
    price: numberOrUndefined(first.price),
    image,
    gallery: [first.image_1, first.image_2].filter(Boolean),
    inStock: rows.some((row) => row.availability === "موجود"),
    stockCount: numberOrUndefined(first.total_product_stock || first.stock),
    packQuantity: numberOrUndefined(first.product_pack_quantity || first.pack_quantity),
    sku: first.variant_sku || undefined,
    productCode: productId,
    brand: "",
    ashkanProductUrl: first.ashkan_url || undefined,
    variants: variations,
    sourceRows: rows,
  };
});

export const importedSourceStats = {
  rows: rawRows.length,
  products: importedProducts.length,
  variants: rawRows.length,
  available: rawRows.filter((row) => row.availability === "موجود").length,
  unavailable: rawRows.filter((row) => row.availability === "ناموجود").length,
};

export function getImportedProductById(id: string) { return importedProducts.find((product) => product.id === id); }
export function getImportedProductsByCategory(categoryId: string) { return importedProducts.filter((product) => product.categoryId === categoryId); }
export function searchImportedProducts(query: string) {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  return importedProducts.filter((p) => [p.name.fa, p.productCode, p.sku, p.categoryId, importedCategories.find((c) => c.id === p.categoryId)?.name.fa, p.description.fa, ...(p.variants ?? []).flatMap((v) => [v.name.fa, v.sku, v.technicalSpec])].filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(q)));
}
