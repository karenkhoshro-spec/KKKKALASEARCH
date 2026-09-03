import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Test isolation: every unit test run writes orders/revocations into a fresh
 * temp store instead of the runtime `data/orders.json` that the live app
 * reads from. Without this, `createOrder` tests pollute the admin order list
 * (and could corrupt the store through parallel writes).
 *
 * Files run sequentially so the temp store is never touched concurrently.
 */
const testDataDir = mkdtempSync(join(tmpdir(), "kala-order-tests-"));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    fileParallelism: false,
    env: {
      ORDER_STORE_PATH: join(testDataDir, "orders.json"),
    },
  },
});
