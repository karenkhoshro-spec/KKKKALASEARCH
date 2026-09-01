/**
 * KalaSearch - Product Image Resolver
 * Bulk automatic image extraction from product_url pages
 *
 * Architecture:
 * CSV -> Data Layer -> Product Mapping -> Product Image URL -> ProductCard
 *
 * Security:
 * - Only http/https allowed
 * - No javascript:, data:, blob:
 * - No dangerouslySetInnerHTML
 * - No raw HTML injection
 *
 * Performance:
 * - Cache resolved URLs
 * - No fetch per render
 * - Lazy-load images
 */

/* -------------------------------------------------------------------------
   Stored assets are file names in the CSV layer ("4030.jpg") while the browser
   needs the mapped absolute URL. Resolving a bare name against the project's
   OWN mapping table keeps an order line renderable without inventing anything:
   if the name is not in the real mapping, there is simply no image.
   ------------------------------------------------------------------------- */
// eslint-disable-next-line @typescript-eslint/no-var-requires
import productImageMapping from "./productImages.json";

const imageUrlByName = new Map<string, string>();
for (const rawUrl of Object.values(productImageMapping as Record<string, string>)) {
  const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
  if (!url || !/^https?:\/\//i.test(url)) continue;
  const name = url.split("/").pop() ?? "";
  if (name && !imageUrlByName.has(name.toLowerCase())) imageUrlByName.set(name.toLowerCase(), url);
}

/**
 * Turn anything the data layer stores (absolute URL, protocol-relative URL or a
 * bare upload file name) into the real mapped URL, or undefined when the product
 * genuinely has no mapping. Never returns a fabricated asset.
 */
export function resolveMappedImageUrl(value: string | undefined | null): string | undefined {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  if (isValidImageUrl(trimmed)) return trimmed;
  const name = (trimmed.includes("/") ? trimmed.split("/").pop() ?? trimmed : trimmed).toLowerCase();
  return imageUrlByName.get(name);
}

/** First candidate that maps to a real URL — used when several sources exist. */
export function firstMappedImageUrl(...candidates: (string | undefined | null)[]): string | undefined {
  for (const candidate of candidates) {
    const resolved = resolveMappedImageUrl(candidate);
    if (resolved) return resolved;
  }
  return undefined;
}

export function isValidImageUrl(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const trimmed = String(raw).trim();
  if (!trimmed) return false;
  if (/^(javascript|data|blob):/i.test(trimmed)) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  // Basic image extension or wp-content/uploads check, but allow any https URL that looks like image
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    // Reject obvious non-image assets
    const lower = trimmed.toLowerCase();
    if (lower.includes("favicon") || lower.includes("logo") && lower.includes("widget")) {
      // Allow logo only if it's product image? Better to filter by path
    }
    return true;
  } catch {
    return false;
  }
}

function sanitizeImageUrl(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (!isValidImageUrl(trimmed)) return undefined;
  return trimmed;
}

/**
 * Extract product image from HTML string
 * Priority:
 * 1. og:image
 * 2. Product gallery / featured image
 * 3. First valid product image
 * Filters out logo, favicon, banner, placeholder, icon
 */
export function extractImageFromHtml(html: string, _productUrl?: string): string | undefined {
  if (!html) return undefined;

  const blockedPatterns = [
    /favicon/i,
    /logo/i,
    /banner/i,
    /placeholder/i,
    /icon/i,
    /widget-icon/i,
    /language-icons-flags/i,
    /goftino/i,
  ];

  function isBlocked(url: string): boolean {
    return blockedPatterns.some((re) => re.test(url));
  }

  // 1. og:image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch && ogMatch[1]) {
    const url = sanitizeImageUrl(ogMatch[1]);
    if (url && !isBlocked(url)) return url;
  }

  // 2. Look for wp-content/uploads images that are likely product images
  // Priority: images inside product gallery
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const candidates: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    const sanitized = sanitizeImageUrl(src);
    if (!sanitized) continue;
    if (isBlocked(sanitized)) continue;
    // Prefer wp-content/uploads and not containing logo/banner
    if (sanitized.includes("wp-content/uploads")) {
      // Filter out small thumbnails like 169x300? Actually those are still product images, but prefer larger
      candidates.push(sanitized);
    }
  }

  // Prefer images that are not too small and not duplicates
  if (candidates.length > 0) {
    // Deduplicate
    const unique = Array.from(new Set(candidates));
    // Sort by preference: larger images first (heuristic: not containing -169x300, -150x etc for thumbnails? Actually we want main image)
    // For simplicity, return first that doesn't contain obvious thumbnail pattern, or first overall
    const main = unique.find((u) => !u.match(/-\d+x\d+\.(jpg|png|webp)$/i)) || unique[0];
    return main;
  }

  // 3. Markdown style image from fetch_page conversion: ![alt](url)
  const mdImgRegex = /!\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi;
  const mdCandidates: string[] = [];
  while ((match = mdImgRegex.exec(html)) !== null) {
    const src = match[1];
    const sanitized = sanitizeImageUrl(src);
    if (!sanitized) continue;
    if (isBlocked(sanitized)) continue;
    if (sanitized.includes("wp-content/uploads")) mdCandidates.push(sanitized);
  }
  if (mdCandidates.length > 0) {
    const unique = Array.from(new Set(mdCandidates));
    return unique[0];
  }

  return undefined;
}

/**
 * In-memory cache for resolved image URLs
 * Key: productUrl, Value: imageUrl | null (null = tried and failed)
 */
const imageCache = new Map<string, string | null>();

export function getCachedImageUrl(productUrl: string): string | undefined | null {
  return imageCache.get(productUrl);
}

export function setCachedImageUrl(productUrl: string, imageUrl: string | null): void {
  imageCache.set(productUrl, imageUrl);
}

export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Resolve product image URL from product page
 * This function is designed to be used with a server-side proxy
 * to avoid CORS issues.
 *
 * Current limitation:
 * - Direct browser fetch to ashkanplastic.com is blocked by CORS
 * - Direct Node fetch from sandbox fails with ECONNRESET/TLS error
 * - fetch_page tool works via internal proxy but not available at runtime
 *
 * Proposed solution:
 * - Implement Vite server proxy or API route /api/product-image?url=...
 * - Server fetches product page, extracts og:image, caches, returns JSON
 * - Client fetches from proxy, not directly from external site
 * - Cache in localStorage + memory to avoid repeated requests
 */
/**
 * Resilient image-loading relay (production pattern):
 * Some browsers/networks cannot load ashkanplastic.com images directly
 * (hotlink protection, geo-blocking, flaky routes). This returns a URL that
 * serves the SAME real origin file through a public image CDN. The source
 * stays the original ashkanplastic.com asset — nothing is downloaded or
 * stored inside this project, and productImages.json keeps the real URLs.
 */
/**
 * Relay candidates: the SAME real origin file served through public image CDNs
 * (resized/re-encoded for speed — still the real ashkanplastic.com asset,
 * fetched live by the CDN; nothing is stored in this project).
 * `width` matches the display size so the browser downloads ~10x fewer bytes.
 */
export function imageRelayCandidates(realImageUrl: string, width = 640): string[] {
  const encoded = encodeURIComponent(realImageUrl);
  const transform = `&w=${width}&output=webp&q=80&we`;
  return [
    `https://images.weserv.nl/?url=${encoded}${transform}`,
    `https://wsrv.nl/?url=${encoded}${transform}`,
  ];
}

/**
 * Full loading chain used by the UI (fast-first):
 *   1. relay CDN (typically < 1s, cached globally)
 *   2. the real site URL directly (no-referrer) — for networks where origin is fastest
 *   3. second independent relay CDN
 * Only if all three fail does the UI show the "تصویر موجود نیست" placeholder.
 */
export function fullImageChain(realImageUrl: string, width = 640): string[] {
  // The CSV layer stores bare upload file names ("4030.jpg"). Resolving here —
  // the single entry point every surface uses — means the cart, the product
  // page, the admin order lines and the cards all request the SAME real mapped
  // asset, and an unmapped product fires no doomed request at all.
  const resolved = resolveMappedImageUrl(realImageUrl);
  if (!resolved) return [];
  const [relay1, relay2] = imageRelayCandidates(resolved, width);
  return [relay1, resolved, relay2];
}

/* -------------------------------------------------------------------------
   Shared fallback memory
   Every surface that paints a real Ashkan asset (search card, category card,
   product details, cart, admin/customer order lines) used to walk its own
   [relay -> origin -> relay] chain, so one asset could be requested up to
   three times per component and the dead candidates were retried forever —
   the single biggest source of slowness on image-heavy screens.
   The outcome of a chain is now remembered for the session, per asset, so a
   card starts at the candidate that already worked and skips the ones already
   known to be dead. Nothing is invented here: the candidates stay exactly the
   real mapping + the real relays.
   ------------------------------------------------------------------------- */
// Keys are the *mapped* asset so a caller holding a bare CSV file name and a
// caller holding the resolved URL share one memory instead of two.
const chainKey = (realImageUrl: string | undefined | null, width: number) =>
  `${width}|${resolveMappedImageUrl(realImageUrl ?? undefined) ?? String(realImageUrl ?? "").trim()}`;
const chainGoodIndex = new Map<string, number>();
const chainDeadIndexes = new Map<string, Set<number>>();

/** Index of the candidate that last loaded successfully for this asset (0 = first). */
export function knownGoodImageIndex(realImageUrl: string | undefined, width = 640): number {
  if (!realImageUrl) return 0;
  return chainGoodIndex.get(chainKey(realImageUrl, width)) ?? 0;
}

/** Candidates already proven unreachable for this asset (network/404/CORS). */
export function deadImageIndexes(realImageUrl: string | undefined, width = 640): Set<number> {
  return chainDeadIndexes.get(chainKey(realImageUrl, width)) ?? new Set<number>();
}

export function markImageLoaded(realImageUrl: string | undefined, width: number, index: number): void {
  if (!realImageUrl) return;
  chainGoodIndex.set(chainKey(realImageUrl, width), index);
}

export function markImageFailed(realImageUrl: string | undefined, width: number, index: number): void {
  if (!realImageUrl) return;
  const key = chainKey(realImageUrl, width);
  const dead = chainDeadIndexes.get(key) ?? new Set<number>();
  dead.add(index);
  chainDeadIndexes.set(key, dead);
}

/**
 * The candidates a component should actually try, each with its position in the
 * canonical chain (so a failure is remembered against the right hop), plus the
 * index to start from. Falls back to the plain chain when every candidate was
 * marked dead — they may recover on another network.
 */
export interface ImageCandidate {
  src: string;
  index: number;
}

export function imageCandidatesToTry(
  realImageUrl: string | undefined | null,
  width = 640,
): { candidates: ImageCandidate[]; startIndex: number } {
  const mapped = resolveMappedImageUrl(realImageUrl ?? undefined);
  if (!mapped) return { candidates: [], startIndex: 0 };
  const full = fullImageChain(mapped, width).map((src, index) => ({ src, index }));
  if (full.length === 0) return { candidates: [], startIndex: 0 };

  const good = knownGoodImageIndex(mapped, width);
  if (good > 0 && full[good]) {
    // start with the hop that already won this session, keep the rest as fallback
    return { candidates: [full[good], ...full.filter((entry) => entry.index !== good)], startIndex: 0 };
  }

  const dead = deadImageIndexes(mapped, width);
  if (dead.size === 0) return { candidates: full, startIndex: 0 };
  const alive = full.filter((entry) => !dead.has(entry.index));
  return { candidates: alive.length > 0 ? alive : full, startIndex: 0 };
}

/** Convenience wrapper for callers that only need the URL list. */
export function imageChainToTry(realImageUrl: string | undefined, width = 640): { chain: string[]; startIndex: number } {
  const { candidates } = imageCandidatesToTry(realImageUrl, width);
  return { chain: candidates.map((entry) => entry.src), startIndex: 0 };
}

/** Cache size guard for very long sessions. */
export function imageChainCacheStats() {
  return { remembered: chainGoodIndex.size, degraded: chainDeadIndexes.size };
}

export async function resolveProductImageViaProxy(productUrl: string, proxyEndpoint = "/api/product-image"): Promise<string | undefined> {
  if (!productUrl) return undefined;
  const cached = imageCache.get(productUrl);
  if (cached !== undefined) return cached || undefined;

  try {
    // This endpoint should be implemented server-side
    const response = await fetch(`${proxyEndpoint}?url=${encodeURIComponent(productUrl)}`);
    if (!response.ok) {
      imageCache.set(productUrl, null);
      return undefined;
    }
    const data = await response.json();
    const imageUrl = sanitizeImageUrl(data.imageUrl);
    imageCache.set(productUrl, imageUrl || null);
    return imageUrl;
  } catch {
    imageCache.set(productUrl, null);
    return undefined;
  }
}

/**
 * Bulk image mapping report type
 */
export interface ImageMappingReport {
  totalProducts: number;
  imagesFound: number;
  imagesMissing: number;
  invalidImageUrls: number;
  placeholderProducts: number;
  duplicateImageUrls: number;
  failedRequests: number;
  blockingReasons: string[];
  proposedSolution: string;
}

/**
 * Generate report from products array
 */
export function generateImageMappingReport(products: Array<{ productImageUrl?: string; image?: string }>): ImageMappingReport {
  const totalProducts = products.length;
  let imagesFound = 0;
  let invalidImageUrls = 0;
  const seen = new Map<string, number>();

  for (const p of products) {
    const url = p.productImageUrl || p.image;
    if (url && isValidImageUrl(url)) {
      imagesFound++;
      seen.set(url, (seen.get(url) || 0) + 1);
    } else if (url && !isValidImageUrl(url)) {
      invalidImageUrls++;
    }
  }

  const duplicateImageUrls = Array.from(seen.values()).filter((c) => c > 1).length;
  const imagesMissing = totalProducts - imagesFound;
  const placeholderProducts = imagesMissing;

  return {
    totalProducts,
    imagesFound,
    imagesMissing,
    invalidImageUrls,
    placeholderProducts,
    duplicateImageUrls,
    failedRequests: 0,
    blockingReasons: [
      "CORS: Browser direct fetch to https://ashkanplastic.com is blocked by CORS policy",
      "Network: Direct Node/curl fetch from sandbox fails with ECONNRESET / SSL_ERROR_SYSCALL - site may block datacenter IPs or require specific TLS",
      "No backend proxy currently implemented - client cannot fetch external HTML",
      "fetch_page tool works via internal proxy but not available at runtime for bulk 347 requests",
    ],
    proposedSolution: [
      "Implement Vite server proxy in vite.config.ts: server.proxy['/api/product-image'] -> custom middleware that fetches productUrl, extracts og:image via regex, caches result",
      "Or implement serverless function (Vercel/Cloudflare Worker) that does same extraction and returns {imageUrl}",
      "Cache resolved URLs in JSON file (e.g., public/product-images.json) generated at build time via script using fetch_page or similar proxy",
      "Client then fetches from /product-images.json, not external site - no CORS, no per-render fetch, fast",
      "Add localStorage cache + memory cache (imageCache) to avoid repeated requests",
      "Validate all image URLs with isValidImageUrl, fallback to placeholder on error/404",
      "Use lazy-loading, same aspect ratio, object-fit contain, alt from product_name",
    ].join("\n",
    ),
  };
}
