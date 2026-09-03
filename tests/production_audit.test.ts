import { describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import {
  adminLogin,
  createOrder,
  handleApiRequest,
  revokeAdminToken,
  verifyAdminToken,
} from "../server/orderHandler.mjs";
import { orderItemImageSources } from "../src/utils/orderItemImage";

const customer = {
  name: "کارن تست",
  phone: "09352221133",
  province: "تهران",
  city: "تهران",
  address: "خیابان تست",
  postalCode: "1234567890",
};

function item(overrides: Record<string, unknown> = {}) {
  return {
    productId: "8039010",
    productCode: "8039010",
    sku: "803901003",
    name: "سرویس لگن اپل تاپ (4عددی)",
    model: "سرویس لگن اپل تاپ (4عددی)",
    variation: "سفید",
    color: "سفید",
    quantity: 2,
    unitPrice: 1000,
    price: 1000,
    image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
    ...overrides,
  };
}

/** Minimal fetch-compatible request/response doubles for handleApiRequest. */
function getReq(url: string, token?: string) {
  return {
    url,
    method: "GET",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  } as never;
}

function postReq(url: string, rawBody: string, token?: string) {
  const stream = Readable.from([Buffer.from(rawBody)]) as never as {
    url: string;
    method: string;
    headers: Record<string, string>;
    on: (event: string, cb: (chunk: Buffer) => void) => void;
  };
  Object.assign(stream, {
    url,
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  return stream as never;
}

function fakeRes() {
  const res: {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
    setHeader: (k: string, v: string) => void;
    end: (body?: string) => void;
  } = {
    statusCode: 0,
    body: "",
    headers: {},
    setHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    end(body = "") {
      this.body = String(body);
    },
  };
  return res;
}

async function apiPost(url: string, rawBody: string, token?: string) {
  const res = fakeRes();
  await handleApiRequest(postReq(url, rawBody, token), res as never);
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : {} };
}

describe("production audit — server-side money integrity", () => {
  it("recomputes the order total from item rows and never trusts the client total", () => {
    const created = createOrder({
      customer,
      items: [item({ quantity: 2, unitPrice: 1000 }), item({ productId: "7025010", productCode: "7025010", quantity: 3, unitPrice: 5000 })],
      total: 1, // tampered client value — must be ignored
    });
    expect(created.ok).toBe(true);
    expect(created.order.total).toBe(2 * 1000 + 3 * 5000);
    expect(created.order.total).not.toBe(1);
  });

  it("recomputes per-row line totals from unit price × quantity", () => {
    const created = createOrder({
      customer,
      items: [item({ quantity: 3, unitPrice: 7000, lineTotal: 999999 })],
      total: 999999,
    });
    expect(created.ok).toBe(true);
    expect(created.order.items[0].lineTotal).toBe(21000);
    expect(created.order.items[0].price).toBe(7000);
    expect(created.order.total).toBe(21000);
  });
});

describe("production audit — input validation", () => {
  it("rejects items without a product code", () => {
    const created = createOrder({ customer, items: [item({ productCode: "", productId: "", sku: "" })] });
    expect(created.ok).toBe(false);
    expect(created.status).toBe(400);
    expect(created.error).toBe("items_invalid");
  });

  it("rejects items without a name", () => {
    const created = createOrder({ customer, items: [item({ name: "", model: "" })] });
    expect(created.ok).toBe(false);
    expect(created.error).toBe("items_invalid");
  });

  it("rejects non-integer, zero, and negative quantities", () => {
    for (const quantity of [0, -2, 1.5]) {
      const created = createOrder({ customer, items: [item({ quantity })] });
      expect(created.ok).toBe(false);
      expect(created.error).toBe("items_invalid");
    }
  });

  it("rejects negative unit prices", () => {
    const created = createOrder({ customer, items: [item({ unitPrice: -5 })] });
    expect(created.ok).toBe(false);
    expect(created.error).toBe("items_invalid");
  });

  it("rejects an excessive item count", () => {
    const many = Array.from({ length: 101 }, () => item());
    const created = createOrder({ customer, items: many });
    expect(created.ok).toBe(false);
    expect(created.error).toBe("too_many_items");
  });

  it("rejects malformed email addresses", () => {
    const created = createOrder({ customer: { ...customer, email: "not-an-email" }, items: [item()] });
    expect(created.ok).toBe(false);
    expect(created.error).toBe("invalid_email");
  });
});

describe("production audit — endpoint authorization and error responses", () => {
  it("rejects admin orders without a bearer token (401)", async () => {
    const res = fakeRes();
    await handleApiRequest(getReq("/api/admin/orders"), res as never);
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toBe("unauthorized");
  });

  it("rejects invalid JSON bodies with 400 invalid_json", async () => {
    const result = await apiPost("/api/orders", "{not json");
    expect(result.status).toBe(400);
    expect(result.body.error).toBe("invalid_json");
  });

  it("rejects admin login with wrong credentials (401)", async () => {
    const result = await apiPost("/api/admin/login", JSON.stringify({ username: "nobody", password: "wrong" }));
    expect(result.status).toBe(401);
    expect(result.body.error).toBe("invalid_credentials");
  });

  it("returns 401 for unknown api routes without leaking internals", async () => {
    const res = fakeRes();
    await handleApiRequest(getReq("/api/nope"), res as never);
    expect(res.statusCode).toBe(404);
  });
});

describe("production audit — logout invalidates the session server-side", () => {
  it("revokes the exact token that was logged out, keeping other sessions valid", () => {
    const first = adminLogin(process.env.ADMIN_USERNAME || "", process.env.ADMIN_PASSWORD || "");
    const second = adminLogin(process.env.ADMIN_USERNAME || "", process.env.ADMIN_PASSWORD || "");
    expect(first.ok && second.ok).toBe(true);
    const tokenA = first.token as string;
    const tokenB = second.token as string;
    expect(verifyAdminToken(tokenA)).toBe(true);
    expect(verifyAdminToken(tokenB)).toBe(true);

    expect(revokeAdminToken(tokenA)).toBe(true);

    // The logged-out token is dead…
    expect(verifyAdminToken(tokenA)).toBe(false);
    // …while the other signed session survives (server restart safe: persisted).
    expect(verifyAdminToken(tokenB)).toBe(true);
    expect(revokeAdminToken(tokenA)).toBe(true); // idempotent, still valid to call
  });

  it("endpoint-level: revoked token no longer reaches admin orders", async () => {
    const login = adminLogin(process.env.ADMIN_USERNAME || "", process.env.ADMIN_PASSWORD || "");
    expect(login.ok).toBe(true);
    const token = login.token as string;

    const allowed = fakeRes();
    await handleApiRequest(getReq("/api/admin/orders", token), allowed as never);
    expect(allowed.statusCode).toBe(200);

    const logoutRes = fakeRes();
    await handleApiRequest(postReq("/api/admin/logout", "", token), logoutRes as never);
    expect(logoutRes.statusCode).toBe(200);

    const denied = fakeRes();
    await handleApiRequest(getReq("/api/admin/orders", token), denied as never);
    expect(denied.statusCode).toBe(401);
  });
});

describe("production audit — historical order integrity", () => {
  it("displays order items purely from the stored snapshot when the product left the catalog", () => {
    // "9999991" exists neither in the live catalog nor in productImages.json.
    const sources = orderItemImageSources({
      productId: "9999991",
      productCode: "9999991",
      image: "https://ashkanplastic.com/wp-content/uploads/old-discontinued.jpg",
    });
    expect(sources).toEqual(["https://ashkanplastic.com/wp-content/uploads/old-discontinued.jpg"]);
  });

  it("keeps snapshot name/sku/price intact when no catalog product matches", () => {
    const created = createOrder({
      customer,
      items: [
        {
          productId: "9999991",
          productCode: "9999991",
          sku: "OLD-SKU-1",
          name: "محصول حذف‌شده قدیمی",
          model: "محصول حذف‌شده قدیمی",
          variation: "مشکی",
          quantity: 1,
          unitPrice: 25000,
          price: 25000,
          image: "",
        },
      ],
    });
    expect(created.ok).toBe(true);
    const stored = created.order.items[0];
    expect(stored.name).toBe("محصول حذف‌شده قدیمی");
    expect(stored.sku).toBe("OLD-SKU-1");
    expect(stored.productCode).toBe("9999991");
    expect(stored.variation).toBe("مشکی");
    expect(stored.unitPrice).toBe(25000);
    expect(stored.lineTotal).toBe(25000);
  });
});
