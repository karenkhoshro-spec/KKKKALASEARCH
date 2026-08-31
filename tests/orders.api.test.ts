import { describe, expect, it } from "vitest";
import {
  createOrder,
  getOrder,
  listCustomerOrders,
  updateOrderStatus,
  adminLogin,
} from "../server/orderHandler.mjs";

const item = {
  productId: "8039010",
  productCode: "8039010",
  sku: "803901003",
  model: "Test white",
  variation: "white",
  color: "white",
  quantity: 2,
  image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
  price: 1000,
};

describe("order API handler", () => {
  it("persists a multi-item order and isolates by phone", () => {
    const created = createOrder({
      customer: {
        name: "Test Customer",
        phone: "09358135230",
        province: "Tehran",
        city: "Tehran",
        address: "Street 1",
        postalCode: "1234567890",
        notes: "note",
      },
      items: [
        item,
        { ...item, productId: "7025010", productCode: "7025010", sku: "702501006", color: "red", variation: "red", quantity: 1, image: "https://ashkanplastic.com/wp-content/uploads/22212.jpg" },
      ],
      total: 3000,
    });
    expect(created.ok).toBe(true);
    expect(created.order.items).toHaveLength(2);
    expect(created.order.customer.phone).toBe("+989358135230");
    expect(created.order.status).toBe("registered");
    expect(created.order).not.toHaveProperty("email");

    const mine = getOrder(created.order.orderNumber, { phone: "9358135230" });
    expect(mine.ok).toBe(true);

    const other = getOrder(created.order.orderNumber, { phone: "9123456789" });
    expect(other.ok).toBe(false);

    const listed = listCustomerOrders("09358135230");
    expect(listed.some((order: { orderNumber: string }) => order.orderNumber === created.order.orderNumber)).toBe(true);
    expect(listCustomerOrders("9123456789").some((order: { orderNumber: string }) => order.orderNumber === created.order.orderNumber)).toBe(false);

    const shipped = updateOrderStatus(created.order.orderNumber, "shipping");
    expect(shipped.ok).toBe(true);
    expect(shipped.order.status).toBe("shipping");
  });

  it("rejects admin login with wrong password", () => {
    const result = adminLogin("nope", "nope");
    expect(result.ok).toBe(false);
  });
});
