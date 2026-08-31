import { describe, expect, it } from "vitest";
import {
  createOrder,
  getOrder,
  listCustomerOrders,
  updateOrderStatus,
  adminLogin,
  verifyAdminToken,
} from "../server/orderHandler.mjs";

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

  it("rejects admin login with wrong password or username", () => {
    expect(adminLogin("nope", "nope").ok).toBe(false);
    const username = process.env.ADMIN_USERNAME || "";
    expect(username.length).toBeGreaterThan(0);
    expect(adminLogin(username, "wrong-password").ok).toBe(false);
    expect(adminLogin("wrong-username", process.env.ADMIN_PASSWORD || "x").ok).toBe(false);
  });

  it("accepts env admin credentials and keeps a session token", () => {
    const username = process.env.ADMIN_USERNAME || "";
    const password = process.env.ADMIN_PASSWORD || "";
    expect(username.length).toBeGreaterThan(0);
    expect(password.length).toBeGreaterThan(0);
    const result = adminLogin(username, password);
    expect(result.ok).toBe(true);
    expect(typeof result.token).toBe("string");
    expect(verifyAdminToken(result.token)).toBe(true);
  });
});
