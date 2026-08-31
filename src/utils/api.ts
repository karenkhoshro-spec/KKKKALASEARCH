/**
 * KalaSearch API client — talks to the backend that stores REAL orders
 * (server/index.mjs). Same-origin via the vite dev proxy or the node server.
 */

export type OrderStatus = "registered" | "preparing" | "ready_pickup" | "shipping" | "delivered";

export const ORDER_STATUSES: OrderStatus[] = [
  "registered",
  "preparing",
  "ready_pickup",
  "shipping",
  "delivered",
];

export interface OrderItem {
  productId: string;
  name: string;
  productCode?: string;
  sku?: string;
  model?: string;
  image?: string;
  variationId?: string;
  variationName?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderCustomer {
  name: string;
  mobile: string;
  mobileFull?: string;
  address?: string;
  province?: string;
  city?: string;
  postal?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: string;
  lang: string;
  customer: OrderCustomer;
  items: OrderItem[];
  total: number;
  statusHistory?: { status: OrderStatus; at: string; by?: string }[];
}

export interface PlaceOrderPayload {
  customer: {
    name: string;
    mobile: string;
    address?: string;
    province?: string;
    city?: string;
    postal?: string;
    notes?: string;
  };
  items: {
    productId: string;
    name: string;
    productCode?: string;
    sku?: string;
    model?: string;
    image?: string;
    variationId?: string;
    variationName?: string;
    color?: string;
    quantity: number;
    unitPrice: number;
  }[];
  lang?: string;
}

async function parse(res: Response) {
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: res.status, ok: res.ok, body };
}

/** POST /api/orders — registers a REAL order on the server. */
export async function placeOrder(payload: PlaceOrderPayload): Promise<{ ok: boolean; order?: Order; error?: string }> {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { ok, body } = await parse(res);
    if (ok && body?.order) return { ok: true, order: body.order as Order };
    return { ok: false, error: body?.error || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** GET /api/orders/:id — one order by id or order number. */
export async function fetchOrder(idOrNumber: string): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(idOrNumber)}`);
    const { ok, body } = await parse(res);
    return ok && body?.order ? (body.order as Order) : null;
  } catch {
    return null;
  }
}

/** GET /api/customer/orders?mobile=… — ONLY this customer's orders. */
export async function fetchCustomerOrders(
  mobile: string
): Promise<{ ok: boolean; orders?: Order[]; error?: string }> {
  try {
    const res = await fetch(`/api/customer/orders?mobile=${encodeURIComponent(mobile)}`);
    const { ok, body } = await parse(res);
    if (ok) return { ok: true, orders: (body?.orders ?? []) as Order[] };
    return { ok: false, error: body?.error || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** POST /api/admin/login */
export async function adminLogin(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const { ok, body } = await parse(res);
    return ok ? { ok: true } : { ok: false, error: body?.error || "login failed" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** GET /api/admin/session */
export async function adminSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/session");
    return res.ok;
  } catch {
    return false;
  }
}

/** POST /api/admin/logout */
export async function adminLogout(): Promise<void> {
  try {
    await fetch("/api/admin/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
}

/** GET /api/admin/orders */
export async function adminFetchOrders(): Promise<{ ok: boolean; orders?: Order[]; error?: string }> {
  try {
    const res = await fetch("/api/admin/orders");
    const { ok, body } = await parse(res);
    if (ok) return { ok: true, orders: (body?.orders ?? []) as Order[] };
    return { ok: false, error: body?.error || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** PATCH /api/admin/orders/:id/status */
export async function adminUpdateStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ ok: boolean; order?: Order; error?: string }> {
  try {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const { ok, body } = await parse(res);
    if (ok && body?.order) return { ok: true, order: body.order as Order };
    return { ok: false, error: body?.error || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
