import { describe, expect, it } from "vitest";
import { buildOrderItems } from "../src/utils/ordersApi";
import { getProductById } from "../src/data/products";
import { resolveCartPrice } from "../src/context/CartContext";
import type { CartItem } from "../src/types";

/**
 * The exact customer journey from the handoff, at the payload boundary:
 *   product → colour → quantity → cart → buildOrderItems → POST /api/orders
 * Uses the real catalog rows (8039010 white x2, 7025010 red x1) — no fixtures
 * invented for the products themselves.
 */
function cartItem(productId: string, colorNeedle: string, quantity: number): CartItem {
  const product = getProductById(productId);
  if (!product) throw new Error(`unknown product ${productId}`);
  const variation = product.variations?.find(
    (entry) => (entry.colorName ?? "").includes(colorNeedle) || entry.name.fa.includes(colorNeedle),
  );
  if (!variation) throw new Error(`no ${colorNeedle} variation on ${productId}`);
  return {
    productId,
    name: variation.name.fa,
    image: variation.image || product.productImageUrl || product.image,
    price: resolveCartPrice(product, { id: variation.id, name: variation.name.fa, sku: variation.sku, price: variation.price, color: variation.colorName, colorHex: variation.color }),
    quantity,
    variation: {
      id: variation.id,
      name: variation.name.fa,
      sku: variation.sku,
      price: variation.price,
      color: variation.colorName,
      colorHex: variation.color,
      image: variation.image || product.productImageUrl,
    },
  };
}

describe("customer journey payload", () => {
  const items = buildOrderItems([cartItem("8039010", "سفید", 2), cartItem("7025010", "قرمز", 1)]);

  it("carries the two ordered products with real identifiers", () => {
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.productId)).toEqual(["8039010", "7025010"]);
    expect(items.map((i) => i.productCode)).toEqual(["8039010", "7025010"]);
    expect(items[0].sku).toBe("803901003");
    expect(items[1].sku).toBe("702501006");
    expect(items[0].name).toContain("سفید");
    expect(items[1].name).toContain("قرمز");
  });

  it("snapshots the real image, colour, variation and availability", () => {
    expect(items[0].image).toContain("ashkanplastic.com");
    expect(items[1].image).toContain("ashkanplastic.com");
    expect(items[0].color).toBe("سفید");
    expect(items[1].color).toBe("قرمز");
    expect(items[0].colorCode).toMatch(/^#/);
    expect(items[1].colorCode).toMatch(/^#/);
    expect(items[0].availability).toBe("موجود");
    expect(items[1].availability).toBe("موجود");
    expect(items[0].stockCount).toBeGreaterThan(0);
    expect(items[1].stockCount).toBeGreaterThan(0);
  });

  it("computes unit price and line totals the admin will bill", () => {
    for (const item of items) {
      expect(item.unitPrice).toBeGreaterThan(0);
      expect(item.lineTotal).toBe(item.unitPrice * item.quantity);
    }
    expect(items[0].quantity).toBe(2);
    expect(items[1].quantity).toBe(1);
  });

  it("marks an out-of-stock variation so the API can refuse it", () => {
    const outOfStock = cartItem("7025010", "شفاف", 1);
    const [payload] = buildOrderItems([outOfStock]);
    expect(payload.availability).toBe("ناموجود");
    expect(payload.stockCount).toBe(0);
  });
});
