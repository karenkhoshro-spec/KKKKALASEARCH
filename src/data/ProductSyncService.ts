import type { Product } from "../types";
import type { ProductProvider } from "./providers/ProductProvider";

export type SyncStatus = "success" | "error" | "offline";
export interface SyncResult { status: SyncStatus; source: string; syncedAt: string; products: number; error?: string; }

/** Future orchestration boundary for CSV/API/database synchronization. */
export class ProductSyncService {
  constructor(private readonly provider: ProductProvider) {}

  async snapshot(): Promise<SyncResult & { data?: Product[] }> {
    try {
      const data = this.provider.getProducts();
      return { status: "success", source: "provider", syncedAt: new Date().toISOString(), products: data.length, data };
    } catch (error) {
      return { status: "error", source: "provider", syncedAt: new Date().toISOString(), products: 0, error: error instanceof Error ? error.message : "Unknown sync error" };
    }
  }
}
