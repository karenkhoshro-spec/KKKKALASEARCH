import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  createOrder,
  getOrder,
  listCustomerOrders,
  updateOrderStatus,
  adminLogin,
  verifyAdminToken,
} from "../server/orderHandler.mjs";

/**
 * Throwaway credentials used only by the test suite. Real admin credentials are
 * never stored in the repository: `server/orderHandler.mjs` reads them from
 * ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET at process start.
 */
const TEST_ADMIN = {
  username: "qa-admin",
  password: "qa-password-not-real",
  secret: "qa-session-secret-not-real",
};

function withTestAdminEnv(creds: { username: string; password: string; secret: string }, run: () => void) {
  const prev = {
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  };
  process.env.ADMIN_USERNAME = creds.username;
  process.env.ADMIN_PASSWORD = creds.password;
  process.env.ADMIN_SESSION_SECRET = creds.secret;
  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}


const white = {
  productId: "8039010",
  productCode: "8039010",
  sku: "803901003",
  name: "Test white",
  model: "Test white",
  variation: "white",
  color: "white",
  quantity: 2,
  image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
  unitPrice: 1000,
  price: 1000,
};

const red = {
  ...white,
  productId: "7025010",
  productCode: "7025010",
  sku: "702501006",
  name: "Test red",
  model: "Test red",
  color: "red",
  variation: "red",
  quantity: 1,
  image: "https://ashkanplastic.com/wp-content/uploads/22212.jpg",
};

describe("order API handler", () => {
  it("persists a two-color order with payment status separate from order status", () => {
    const created = createOrder({
      customer: {
        name: "Test Customer",
        phone: "09358135230",
        email: "test@example.com",
        province: "Tehran",
        city: "Tehran",
        address: "Street 1",
        postalCode: "1234567890",
        notes: "note",
      },
      items: [white, red],
      total: 3000,
    });
    expect(created.ok).toBe(true);
    expect(created.order.items).toHaveLength(2);
    expect(created.order.items[0].quantity).toBe(2);
    expect(created.order.items[0].color).toBe("white");
    expect(created.order.items[0].unitPrice).toBe(1000);
    expect(created.order.items[0].lineTotal).toBe(2000);
    expect(created.order.items[0].name).toBe("Test white");
    expect(created.order.items[1].quantity).toBe(1);
    expect(created.order.items[1].color).toBe("red");
    expect(created.order.items[1].lineTotal).toBe(1000);
    expect(created.order.customer.phone).toBe("+989358135230");
    expect(created.order.customer.email).toBe("test@example.com");
    expect(created.order.status).toBe("registered");
    expect(created.order.paymentStatus).toBe("unpaid");
    expect(created.order.document.filename).toBe(`${created.order.orderNumber}.pdf`);
    expect(created.order).not.toHaveProperty("email");

    const mine = getOrder(created.order.orderNumber, { phone: "9358135230" });
    expect(mine.ok).toBe(true);
    expect(mine.order.paymentStatus).toBe("unpaid");

    const other = getOrder(created.order.orderNumber, { phone: "9123456789" });
    expect(other.ok).toBe(false);

    const listed = listCustomerOrders("09358135230");
    expect(listed.some((order: { orderNumber: string }) => order.orderNumber === created.order.orderNumber)).toBe(true);
    expect(listCustomerOrders("9123456789").some((order: { orderNumber: string }) => order.orderNumber === created.order.orderNumber)).toBe(false);

    const shipped = updateOrderStatus(created.order.orderNumber, "shipping");
    expect(shipped.ok).toBe(true);
    expect(shipped.order.status).toBe("shipping");
    expect(shipped.order.paymentStatus).toBe("unpaid");
  });

  it("returns 503 when admin credentials are not configured (no hardcoded fallback)", () => {
    withTestAdminEnv({ username: "", password: "", secret: "" }, () => {
      // unconfigured server must refuse before comparing anything
      const result = adminLogin(TEST_ADMIN.username, TEST_ADMIN.password);
      expect(result.ok).toBe(false);
      expect(result.status).toBe(503);
      expect(result.error).toBe("admin_not_configured");
    });
  });

  it("rejects admin login with wrong password or username", () => {
    withTestAdminEnv(TEST_ADMIN, () => {
      expect(adminLogin("nope", "nope").ok).toBe(false);
      expect(adminLogin(TEST_ADMIN.username, "wrong-password").status).toBe(401);
      expect(adminLogin(TEST_ADMIN.username, "wrong-password").ok).toBe(false);
      expect(adminLogin("wrong-username", TEST_ADMIN.password).ok).toBe(false);
      // username is case-insensitive, password is not
      expect(adminLogin(TEST_ADMIN.username.toUpperCase(), TEST_ADMIN.password).ok).toBe(true);
      expect(adminLogin(TEST_ADMIN.username, TEST_ADMIN.password.toUpperCase()).ok).toBe(false);
    });
  });

  it("accepts env admin credentials and keeps a session token", () => {
    withTestAdminEnv(TEST_ADMIN, () => {
      const result = adminLogin(TEST_ADMIN.username, TEST_ADMIN.password);
      expect(result.ok).toBe(true);
      expect(typeof result.token).toBe("string");
      expect(verifyAdminToken(result.token)).toBe(true);
      expect(verifyAdminToken(`${result.token}tampered`)).toBe(false);
      expect(verifyAdminToken("")).toBe(false);
    });
  });

  it("persists color circle value, variation, availability and stock snapshot on each line", () => {
    const created = createOrder({
      customer: {
        name: "Snapshot Customer",
        phone: "09121112233",
        province: "Gilan",
        city: "Rasht",
        address: "Snapshot Street 9",
        postalCode: "4411122334",
      },
      items: [
        {
          productId: "8039010",
          productCode: "8039010",
          sku: "803901003",
          name: "سرویس لگن اپل تاپ 4 عددی سفید",
          model: "سرویس لگن اپل تاپ 4 عددی سفید",
          variation: "4 عددی",
          color: "سفید",
          colorCode: "#ffffff",
          quantity: 2,
          image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
          unitPrice: 1000,
          price: 1000,
          availability: "موجود",
          stockCount: 86,
        },
      ],
      total: 2000,
    });
    expect(created.ok).toBe(true);
    const line = created.order.items[0];
    expect(line.color).toBe("سفید");
    expect(line.colorCode).toBe("#ffffff");
    expect(line.variation).toBe("4 عددی");
    expect(line.availability).toBe("موجود");
    expect(line.stockCount).toBe(86);
    expect(line.image).toBe("https://ashkanplastic.com/wp-content/uploads/4030.jpg");
    expect(line.lineTotal).toBe(2000);
  });

  it("refuses an order that contains an explicitly out-of-stock line", () => {
    const rejected = createOrder({
      customer: {
        name: "Out Of Stock Customer",
        phone: "09121112244",
        province: "Gilan",
        city: "Rasht",
        address: "Snapshot Street 10",
        postalCode: "4411122335",
      },
      items: [
        {
          productId: "7025010",
          productCode: "7025010",
          sku: "702501008",
          name: "سطل نخل بزرگ اشکان شفاف",
          quantity: 1,
          unitPrice: 500,
          lineTotal: 500,
          availability: "ناموجود",
          stockCount: 0,
        },
      ],
      total: 500,
    });
    expect(rejected.ok).toBe(false);
    expect(rejected.status).toBe(409);
    expect(rejected.error).toBe("item_unavailable");
    expect(rejected.productIds).toContain("7025010");
  });

  it("keeps a delivered order visible to its own customer after re-reading the store", () => {
    withTestAdminEnv(TEST_ADMIN, () => {
      const created = createOrder({
        customer: {
          name: "Isolation A",
          phone: "09350001111",
          province: "Tehran",
          city: "Tehran",
          address: "Avenue A",
          postalCode: "1111111111",
        },
        items: [{ productId: "8039010", sku: "803901003", name: "A item", quantity: 1, unitPrice: 700, lineTotal: 700, availability: "موجود" }],
        total: 700,
      });
      expect(created.ok).toBe(true);
      const number = created.order.orderNumber;

      // full status walk as an admin would perform it
      for (const status of ["preparing", "shipping", "delivered"]) {
        const updated = updateOrderStatus(number, status);
        expect(updated.ok).toBe(true);
        expect(updated.order.status).toBe(status);
      }

      // a fresh read (what happens after a refresh or a server restart) still says delivered
      expect(getOrder(number, { admin: true }).order.status).toBe("delivered");
      const mine = listCustomerOrders("09350001111");
      expect(mine.find((order: { orderNumber: string }) => order.orderNumber === number)?.status).toBe("delivered");

      // customer isolation: another phone number can never see it
      expect(listCustomerOrders("09350002222").some((order: { orderNumber: string }) => order.orderNumber === number)).toBe(false);
      expect(getOrder(number, { phone: "09350002222" }).ok).toBe(false);
    });
  });

  it("keeps real admin credentials out of the repository", () => {
    const source = fs.readFileSync(new URL("../server/orderHandler.mjs", import.meta.url), "utf8");
    // a non-empty fallback string after `||` would mean a credential committed to git
    expect(source).not.toMatch(/ADMIN_PASSWORD\s*\|\|\s*["'`][^"'`]/);
    expect(source).not.toMatch(/ADMIN_USERNAME\s*\|\|\s*["'`][^"'`]/);
    expect(source).not.toMatch(/ADMIN_SESSION_SECRET\s*\|\|\s*["'`][^"'`]/);
    expect(source).toMatch(/process\.env\.ADMIN_PASSWORD\s*\|\|\s*""/);
  });
});
