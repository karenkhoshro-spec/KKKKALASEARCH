/**
 * Module-level cache of image URLs the browser has already decoded in this
 * session. Components consult it to render instantly (no fade-in wait) and
 * to avoid needless re-decode work when the same product image appears on
 * several screens (list → details → cart). The browser's HTTP cache prevents
 * duplicate network fetches; this set prevents duplicate *display* latency.
 */
const loadedImageUrls = new Set<string>();

export function isImageLoaded(url: string | undefined): boolean {
  return !!url && loadedImageUrls.has(url);
}

export function markImageLoaded(url: string | undefined): void {
  if (url) loadedImageUrls.add(url);
}
