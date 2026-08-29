import type { Category, Product, ProductVariation } from "../types";

export type AshkanApiPayload<T> = T[] | { data: T[]; nextCursor?: string | null; hasNext?: boolean };
export class AshkanApiError extends Error {
  constructor(public readonly code: "CONFIGURATION" | "TIMEOUT" | "RATE_LIMITED" | "HTTP" | "INVALID_RESPONSE" | "NETWORK", message: string, public readonly status?: number, public readonly retryAfterMs?: number) { super(message); this.name = "AshkanApiError"; }
}

type Validator<T> = (value: unknown) => value is T;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Backend-facing transport boundary. It contains no credential and is not instantiated by the current CSV frontend. */
export class AshkanPlasticClient {
  constructor(private readonly baseUrl: string, private readonly options: { timeoutMs?: number; maxRetries?: number } = {}) {}

  private async get<T>(path: string, validate: Validator<T>, query?: Record<string, string | number | undefined>): Promise<T> {
    if (!this.baseUrl) throw new AshkanApiError("CONFIGURATION", "Ashkan API is not configured");
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}${path}`);
    Object.entries(query ?? {}).forEach(([key, value]) => value !== undefined && url.searchParams.set(key, String(value)));
    const timeoutMs = this.options.timeoutMs ?? 8000;
    const maxRetries = this.options.maxRetries ?? 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "");
          if (attempt < maxRetries) { await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** attempt * 500); continue; }
          throw new AshkanApiError("RATE_LIMITED", "Ashkan API rate limit exceeded", 429, Number.isFinite(retryAfter) ? retryAfter * 1000 : undefined);
        }
        if (!response.ok) {
          if (attempt < maxRetries && (response.status === 408 || response.status >= 500)) { await sleep(2 ** attempt * 250); continue; }
          throw new AshkanApiError("HTTP", `Ashkan API request failed: ${response.status}`, response.status);
        }
        let payload: unknown;
        try { payload = await response.json(); } catch { throw new AshkanApiError("INVALID_RESPONSE", "Ashkan API returned invalid JSON", response.status); }
        if (!validate(payload)) throw new AshkanApiError("INVALID_RESPONSE", "Ashkan API response failed validation", response.status);
        return payload;
      } catch (error) {
        if (error instanceof AshkanApiError) throw error;
        if (attempt < maxRetries) { await sleep(2 ** attempt * 250); continue; }
        if (error instanceof DOMException && error.name === "AbortError") throw new AshkanApiError("TIMEOUT", "Ashkan API request timed out");
        throw new AshkanApiError("NETWORK", "Ashkan API request failed");
      } finally { globalThis.clearTimeout(timeout); }
    }
    throw new AshkanApiError("NETWORK", "Ashkan API request failed");
  }

  private async list<T>(path: string, query: Record<string, string | number | undefined> = {}): Promise<{ data: T[]; nextCursor?: string | null }> {
    const payload = await this.get<AshkanApiPayload<T>>(path, (value): value is AshkanApiPayload<T> => Array.isArray(value) || (!!value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)), query);
    return Array.isArray(payload) ? { data: payload } : { data: payload.data, nextCursor: payload.nextCursor };
  }

  getProducts(page?: { cursor?: string; limit?: number }) { return this.list<Product>("/api/products", page); }
  getProduct(id: string) { return this.get<Product>(`/api/products/${encodeURIComponent(id)}`, (value): value is Product => !!value && typeof value === "object"); }
  searchProducts(query: string, page?: { cursor?: string; limit?: number }) { return this.list<Product>("/api/search", { q: query, ...page }); }
  getCategories() { return this.list<Category>("/api/categories").then(({ data }) => data); }
  getVariants(productId: string) { return this.list<ProductVariation>(`/api/products/${encodeURIComponent(productId)}/variants`).then(({ data }) => data); }
  getPrice(productId: string) { return this.get<unknown>(`/api/products/${encodeURIComponent(productId)}/price`, (_value): _value is unknown => true); }
  getInventory(productId: string) { return this.get<unknown>(`/api/inventory/${encodeURIComponent(productId)}`, (_value): _value is unknown => true); }
  getProductLink(productId: string) { return this.get<{ url?: string }>(`/api/products/${encodeURIComponent(productId)}/link`, (value): value is { url?: string } => !!value && typeof value === "object"); }
}
