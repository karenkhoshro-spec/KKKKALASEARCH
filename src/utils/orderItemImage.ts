import { isValidImageUrl, fullImageChain } from "../data/productImageResolver";
import { getProductById } from "../data/products";
import type { OrderItemPayload } from "./ordersApi";

function looksLikeDirectAsset(url: string): boolean {
  return /(?:ashkanplastic\.com|wp-content\/uploads|\.(?:jpe?g|png|webp|gif|avif)(?:$|[?#]))/i.test(url);
}

/**
 * Real image URL(s) for an order item, in priority order:
 *  1. the image stored on the order item at creation time,
 *  2. the real product image mapping of the catalog product (productImages.json).
 * Both stay the REAL origin file — this module only returns the original URLs;
 * callers build the relay chain via {@link orderItemImageChain}.
 */
export function orderItemImageSources(item: Pick<OrderItemPayload, "productId" | "productCode" | "image">): string[] {
  const stored = String(item.image || "").trim();
  const product = getProductById(String(item.productId || item.productCode || ""));
  const mapped =
    typeof product === "object" && product !== null
      ? String((product as { productImageUrl?: string; image?: string }).productImageUrl || product.image || "").trim()
      : "";
  const out: string[] = [];
  for (const url of [stored, mapped]) {
    if (!url) continue;
    if (!isValidImageUrl(url)) continue;
    if (!out.includes(url)) out.push(url);
  }
  return out;
}

/**
 * Full loading chain used by the admin order thumbnails:
 * for every real source URL, [relay CDN → real site → second relay CDN].
 * Direct ashkanplastic.com assets are wrapped by the app-wide relay chain; an
 * already-resolved CDN/other URL is used as-is (never double-proxied).
 */
export function orderItemImageChain(item: Pick<OrderItemPayload, "productId" | "productCode" | "image">, width = 300): string[] {
  const out: string[] = [];
  for (const source of orderItemImageSources(item)) {
    const candidates = looksLikeDirectAsset(source) ? fullImageChain(source, width) : [source];
    for (const candidate of candidates) {
      if (!out.includes(candidate)) out.push(candidate);
    }
  }
  return out;
}
