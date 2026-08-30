/**
 * KalaSearch — product image URL validation.
 *
 * Architecture: CSV / productImages.json -> data layer -> ProductCard /
 * ProductDetails. Image URLs are only ever the product's own mapped URL; a
 * missing image stays missing (clean in-UI fallback text) and is never
 * replaced with an unrelated product's image.
 *
 * Security: only http/https URLs are accepted; javascript:, data:, blob:
 * are rejected.
 */

export function isValidImageUrl(raw: string | undefined | null): boolean {
  if (!raw) return false;
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
