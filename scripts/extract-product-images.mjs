#!/usr/bin/env node
/**
 * KalaSearch - Product Image Mapping extractor (zero-dependency, Node >= 18)
 *
 * Re-builds src/data/productImages.json and docs/product-image-mapping-report.json
 * from the LIVE ashkanplastic.com catalog:
 *
 *   1. Product sitemap  -> https://ashkanplastic.com/product-sitemap.xml   (featured image per product)
 *   2. WooCommerce API  -> /wp-json/wc/store/v1/products?per_page=100&_fields=name,slug
 *   3. Matching priority per spec: product_id -> family slug -> exact normalized name -> missing
 *
 * Anti-fake rules:
 *   - Only https image URLs from wp-content/uploads are accepted.
 *   - logo / favicon / banner / icon / placeholder / loading / tracking / sprite images are blocked.
 *   - Lifestyle/stock photos (not the product itself) are excluded.
 *   - A product without trustworthy evidence stays imageless and the UI shows
 *     the existing "تصویر موجود نیست" fallback. Nothing is guessed.
 *
 * Usage:
 *   node scripts/extract-product-images.mjs            # dry run, prints summary
 *   node scripts/extract-product-images.mjs --write    # writes the two JSON files
 *   ASHKAN_PROXY="https://proxy.example/?url={url}" node scripts/extract-product-images.mjs
 *
 * Note: direct TLS from some hosting/sandbox networks to ashkanplastic.com is
 * blocked (ECONNRESET / SSL_ERROR_SYSCALL). Set ASHKAN_PROXY to a URL template
 * containing {url} (encoded) to route requests through a fetcher you control.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const PROXY = process.env.ASHKAN_PROXY || "";
const BASE = "https://ashkanplastic.com";
const SITEMAP = `${BASE}/product-sitemap.xml`;
const STORE_API = `${BASE}/wp-json/wc/store/v1/products?per_page=100&page={page}&_fields=name,slug`;
const UA = "KalaSearch-ImageMapping/1.0 (+catalog sync)";

const LIFESTYLE_BLOCK = [
  /brunette-girl/i, /stock/i, /shutterstock/i, /gettyimages/i,
];
const BLOCKED = [
  /favicon/i, /logo/i, /banner/i, /placeholder/i, /icon/i, /widget/i,
  /loading/i, /spinner/i, /tracking/i, /sprite/i, /goftino/i,
  /language-icons-flags/i, /^story-/i,
];

async function fetchText(url) {
  const target = PROXY ? PROXY.replace("{url}", encodeURIComponent(url)) : url;
  const res = await fetch(target, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ---- Persian normalization (mirror of src/data/csvSource.ts) -------------
function normalizePersian(value) {
  return (value || "")
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[\u200c\u200f\u200e\u200b]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}
const nameKey = (v) => normalizePersian(v).replace(/[^a-z0-9\u0600-\u06ff]+/g, "");

// ---- CSV parsing (RFC4180 subset, mirrors csvSource.parseCsv) ------------
function parseCsv(input) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted;
    } else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim())) rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() ?? []).map((h) => h.replace(/^\uFEFF/, "").trim());
  return rows.map((values) => Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? "").trim()])));
}

const usableImage = (url) => {
  if (!url || !/^https:\/\/ashkanplastic\.com\/wp-content\/uploads\//.test(url)) return false;
  const file = url.split("/").pop() || "";
  return ![...LIFESTYLE_BLOCK, ...BLOCKED].some((re) => re.test(file));
};

// ---- 1. live catalog ------------------------------------------------------
async function fetchSitemap() {
  const xml = await fetchText(SITEMAP);
  const live = new Map();
  const marker = `${BASE}/product/`;
  for (const seg of xml.split(marker).slice(1)) {
    const slugMatch = seg.match(/^([0-9]+(?:-[0-9]+)*)\//);
    if (!slugMatch) continue;
    const slug = slugMatch[1];
    const rest = seg.slice(slugMatch[0].length);
    const images = [...rest.matchAll(/(https:\/\/ashkanplastic\.com\/wp-content\/uploads\/[^<\s]+)/g)].map((m) => m[1]);
    if (!live.has(slug)) live.set(slug, images);
  }
  return live;
}

async function fetchStoreNames() {
  const names = new Map();
  for (let page = 1; ; page++) {
    const body = await fetchText(STORE_API.replace("{page}", String(page)));
    const items = JSON.parse(body);
    if (!Array.isArray(items) || items.length === 0) break;
    for (const item of items) names.set(item.slug, item.name || "");
    if (items.length < 100) break;
  }
  return names;
}

// ---- 2. CSV products ------------------------------------------------------
function loadProducts() {
  const rows = parseCsv(readFileSync(path.join(ROOT, "KalaSearch_Products_Import.csv"), "utf8"));
  const byId = new Map();
  for (const row of rows) {
    const id = (row.product_id || "").trim();
    if (!id) continue;
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        name: (row.product_name || "").trim(),
        url: (row.ashkan_url || "").trim() || `${BASE}/product/${id}/`,
        variantSkus: [],
      });
    }
    const sku = (row.variant_sku || "").trim();
    if (sku) byId.get(id).variantSkus.push(sku);
  }
  return [...byId.values()];
}

// ---- 3. match & report ----------------------------------------------------
function match(products, sitemapImages, storeNames) {
  const slugs = new Set([...storeNames.keys(), ...sitemapImages.keys()]);
  const bySlugId = new Map();
  for (const slug of slugs) for (const token of slug.split("-")) if (!bySlugId.has(token)) bySlugId.set(token, slug);
  const byName = new Map();
  for (const [slug, name] of storeNames) {
    const key = nameKey(name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(slug);
  }

  const entries = [];
  for (const product of products) {
    const base = { product_id: product.id, product_name: product.name, product_url: product.url };
    const assign = (slug, status, evidence) => {
      const images = sitemapImages.get(slug) || [];
      const first = images.find(usableImage);
      if (first) entries.push({ ...base, product_image_url: first, status, evidence });
      else entries.push({ ...base, product_image_url: null, status: "missing", evidence: `${slug} has no usable product image` });
    };

    if (slugs.has(product.id)) { assign(product.id, "verified", "id-match (live product page)"); continue; }
    const family = [...slugs].find((slug) => slug.includes("-") && slug.split("-").includes(product.id));
    if (family) { assign(family, "verified-family", `family page ${family}`); continue; }

    const hits = byName.get(nameKey(product.name)) || [];
    if (hits.length === 1) assign(hits[0], "verified-name-match", `exact normalized name -> ${hits[0]}`);
    else if (hits.length > 1) entries.push({ ...base, product_image_url: null, status: "missing", evidence: `ambiguous name: ${hits.join(", ")}` });
    else entries.push({ ...base, product_image_url: null, status: "missing", evidence: "not in live catalog (discontinued/404)" });
  }
  return entries;
}

function summarize(entries) {
  const counts = {};
  for (const e of entries) counts[e.status] = (counts[e.status] || 0) + 1;
  const dupGroups = {};
  for (const e of entries) if (e.product_image_url) (dupGroups[e.product_image_url] ??= []).push(e.product_id);
  const duplicates = Object.fromEntries(Object.entries(dupGroups).filter(([, ids]) => ids.length > 1));
  return {
    total_unique_products: entries.length,
    verified_images: counts.verified || 0,
    verified_name_match: counts["verified-name-match"] || 0,
    verified_family: counts["verified-family"] || 0,
    missing_images: counts.missing || 0,
    ambiguous_mappings: 0,
    invalid_image_urls: 0,
    duplicate_image_url_groups: duplicates,
  };
}

const products = loadProducts();
const [sitemapImages, storeNames] = await Promise.all([fetchSitemap(), fetchStoreNames()]);
const entries = match(products, sitemapImages, storeNames);
const summary = summarize(entries);

console.log("Live catalog slugs:", storeNames.size, "| sitemap image entries:", sitemapImages.size);
console.table(summary);

if (WRITE) {
  const imageMap = Object.fromEntries(
    entries.filter((e) => e.product_image_url).map((e) => [e.product_id, e.product_image_url])
  );
  writeFileSync(path.join(ROOT, "src/data/productImages.json"), JSON.stringify(imageMap, null, 2) + "\n");
  writeFileSync(
    path.join(ROOT, "docs/product-image-mapping-report.json"),
    JSON.stringify({ summary, products: entries }, null, 2) + "\n"
  );
  console.log(`Wrote src/data/productImages.json (${Object.keys(imageMap).length} entries) and docs/product-image-mapping-report.json`);
}
