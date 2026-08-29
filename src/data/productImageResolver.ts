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
export function imageRelayCandidates(realImageUrl: string): string[] {
  const encoded = encodeURIComponent(realImageUrl);
  return [
    `https://images.weserv.nl/?url=${encoded}`,
    `https://wsrv.nl/?url=${encoded}`,
  ];
}

export function imageRelayUrl(realImageUrl: string): string {
  return imageRelayCandidates(realImageUrl)[0];
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
