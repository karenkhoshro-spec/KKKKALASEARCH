import type { CartItem } from "../types";
import { getProductById } from "../data/products";

export const ORDER_STATUSES = ["registered", "preparing", "ready_pickup", "shipping", "delivered"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderItemPayload {
  productId: string;
  productCode: string;
  sku: string;
  name: string;
  model: string;
  variation: string;
  color: string;
  quantity: number;
  image: string;
  unitPrice: number;
  price: number;
  lineTotal: number;
}

export interface CustomerPayload {
  name: string;
  phone: string;
  email?: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  notes?: string;
}

export interface OrderDocument {
  kind: "proforma";
  filename: string;
  generatedAt: string;
  available: boolean;
}

export interface StoredOrder {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  statusUpdatedAt?: string;
  paymentStatus: PaymentStatus;
  customer: CustomerPayload;
  items: OrderItemPayload[];
  total: number;
  document?: OrderDocument;
}

function apiBase() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  return configured ? String(configured).replace(/\/$/, "") : "";
}

async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export function buildOrderItems(items: CartItem[]): OrderItemPayload[] {
  return items.map((item) => {
    const product = getProductById(item.productId);
    const variation = product?.variations?.find((entry) => entry.id === item.variation?.id);
    const unitPrice = item.price ?? 0;
    const name = item.name;
    return {
      productId: item.productId,
      productCode: product?.productCode ?? item.productId,
      sku: item.variation?.sku ?? product?.sku ?? "",
      name,
      model: name,
      variation: item.variation?.name ?? "",
      color: item.variation?.color ?? variation?.colorName ?? "",
      quantity: item.quantity,
      image: item.variation?.image || variation?.image || product?.productImageUrl || product?.image || item.image || "",
      unitPrice,
      price: unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });
}

export async function createRemoteOrder(payload: {
  customer: CustomerPayload;
  items: OrderItemPayload[];
  total: number;
}): Promise<StoredOrder> {
  const res = await fetch(`${apiBase()}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok || !data.order) throw new Error(data.error || "order_failed");
  return data.order as StoredOrder;
}

export async function fetchCustomerOrders(phone: string): Promise<StoredOrder[]> {
  const res = await fetch(`${apiBase()}/api/customer/orders?phone=${encodeURIComponent(phone)}`);
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || "orders_failed");
  return Array.isArray(data.orders) ? data.orders : [];
}

export async function fetchOrderByNumber(orderNumber: string, phone: string): Promise<StoredOrder | null> {
  const res = await fetch(`${apiBase()}/api/orders/${encodeURIComponent(orderNumber)}?phone=${encodeURIComponent(phone)}`);
  const data = await parseJson(res);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(data.error || "order_failed");
  return data.order as StoredOrder;
}

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await fetch(`${apiBase()}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJson(res);
  if (!res.ok || !data.token) throw new Error(data.error || "login_failed");
  return data.token as string;
}

export async function adminSession(token: string): Promise<boolean> {
  const res = await fetch(`${apiBase()}/api/admin/session`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

/** Server-side session invalidation: the current token is revoked immediately. */
export async function adminLogout(token: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/admin/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("logout_failed");
}

export async function fetchAdminOrders(token: string): Promise<StoredOrder[]> {
  const res = await fetch(`${apiBase()}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.error || "orders_failed");
  return Array.isArray(data.orders) ? data.orders : [];
}

export async function patchOrderStatus(token: string, orderNumber: string, status: OrderStatus): Promise<StoredOrder> {
  const res = await fetch(`${apiBase()}/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await parseJson(res);
  if (!res.ok || !data.order) throw new Error(data.error || "status_failed");
  return data.order as StoredOrder;
}
