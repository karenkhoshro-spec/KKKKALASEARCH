import crypto from "crypto";
import fs from "fs";
import path from "path";
import { readOrders, writeOrders } from "./orderStore.mjs";

export const ORDER_STATUSES = ["registered", "preparing", "ready_pickup", "shipping", "delivered"];

function loadDotEnv() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* ignore missing env */
  }
}

loadDotEnv();

export function normalizePhone(input) {
  let d = String(input || "").replace(/\D/g, "");
  if (d.startsWith("0098")) d = d.slice(4);
  else if (d.startsWith("98") && d.length >= 12) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  d = d.slice(0, 10);
  return d.length === 10 && d.startsWith("9") ? `+98${d}` : "";
}

function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

function adminUser() {
  return process.env.ADMIN_USERNAME || "";
}

function adminPass() {
  return process.env.ADMIN_PASSWORD || "";
}

export function signAdminToken() {
  const secret = adminSecret();
  const user = adminUser();
  if (!secret || !user) return "";
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ u: user, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token || !adminSecret()) return false;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return false;
  const expected = crypto.createHmac("sha256", adminSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.u === adminUser() && Number(data.exp) > Date.now();
  } catch {
    return false;
  }
}

export function adminLogin(username, password) {
  const user = adminUser();
  const pass = adminPass();
  if (!user || !pass || !adminSecret()) {
    return { ok: false, status: 503, error: "admin_not_configured" };
  }
  if (username !== user || password !== pass) {
    return { ok: false, status: 401, error: "invalid_credentials" };
  }
  return { ok: true, token: signAdminToken() };
}

function generateOrderNumber(existing) {
  const now = new Date();
  const day = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  for (let i = 0; i < 20; i += 1) {
    const suffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 6);
    const orderNumber = `KS-${day}-${suffix}`;
    if (!existing.some((o) => o.orderNumber === orderNumber)) return orderNumber;
  }
  return `KS-${day}-${Date.now().toString(36).toUpperCase()}`;
}

function publicOrder(order) {
  if (!order) return null;
  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    statusUpdatedAt: order.statusUpdatedAt,
    customer: { ...order.customer },
    items: order.items,
    total: order.total,
  };
}

export function createOrder(payload) {
  const customer = payload?.customer || {};
  const phone = normalizePhone(customer.phone);
  const name = String(customer.name || "").trim();
  const province = String(customer.province || "").trim();
  const city = String(customer.city || "").trim();
  const address = String(customer.address || "").trim();
  const postalCode = String(customer.postalCode || "").replace(/\D/g, "");
  const notes = String(customer.notes || "").trim();
  const items = Array.isArray(payload?.items) ? payload.items : [];

  if (!name) return { ok: false, status: 400, error: "name_required" };
  if (!phone) return { ok: false, status: 400, error: "invalid_phone" };
  if (!province) return { ok: false, status: 400, error: "province_required" };
  if (!city) return { ok: false, status: 400, error: "city_required" };
  if (!address) return { ok: false, status: 400, error: "address_required" };
  if (postalCode.length !== 10) return { ok: false, status: 400, error: "invalid_postal_code" };
  if (items.length === 0) return { ok: false, status: 400, error: "items_required" };

  const normalizedItems = items.map((item) => ({
    productId: String(item.productId || ""),
    productCode: String(item.productCode || ""),
    sku: String(item.sku || ""),
    model: String(item.model || item.name || ""),
    variation: String(item.variation || ""),
    color: String(item.color || ""),
    quantity: Math.max(1, Number(item.quantity) || 1),
    image: String(item.image || ""),
    price: Number(item.price) || 0,
  }));

  const total = Number(payload?.total);
  const computed = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orders = readOrders();
  const order = {
    orderNumber: generateOrderNumber(orders),
    createdAt: new Date().toISOString(),
    status: "registered",
    customer: { name, phone, province, city, address, postalCode, notes },
    items: normalizedItems,
    total: Number.isFinite(total) ? total : computed,
  };
  orders.unshift(order);
  writeOrders(orders);
  return { ok: true, order: publicOrder(order) };
}

export function getOrder(orderNumber, { phone, admin } = {}) {
  const order = readOrders().find((item) => item.orderNumber === orderNumber);
  if (!order) return { ok: false, status: 404, error: "not_found" };
  if (admin) return { ok: true, order: publicOrder(order) };
  const normalized = normalizePhone(phone);
  if (!normalized || normalized !== order.customer.phone) {
    return { ok: false, status: 404, error: "not_found" };
  }
  return { ok: true, order: publicOrder(order) };
}

export function listAdminOrders() {
  return readOrders().map(publicOrder);
}

export function listCustomerOrders(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return [];
  return readOrders().filter((order) => order.customer.phone === normalized).map(publicOrder);
}

export function updateOrderStatus(orderNumber, status) {
  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false, status: 400, error: "invalid_status" };
  }
  const orders = readOrders();
  const index = orders.findIndex((item) => item.orderNumber === orderNumber);
  if (index < 0) return { ok: false, status: 404, error: "not_found" };
  orders[index] = { ...orders[index], status, statusUpdatedAt: new Date().toISOString() };
  writeOrders(orders);
  return { ok: true, order: publicOrder(orders[index]) };
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function bearer(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

export async function handleApiRequest(req, res) {
  const url = new URL(req.url || "/", "http://local.invalid");
  const method = (req.method || "GET").toUpperCase();

  if (method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    res.statusCode = 204;
    res.end();
    return true;
  }

  let raw = "";
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    raw = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      req.on("error", reject);
    });
  }
  let body = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      send(res, 400, { error: "invalid_json" });
      return true;
    }
  }

  if (method === "POST" && url.pathname === "/api/orders") {
    const result = createOrder(body);
    send(res, result.ok ? 201 : result.status, result.ok ? { order: result.order } : { error: result.error });
    return true;
  }

  if (method === "GET" && url.pathname === "/api/customer/orders") {
    send(res, 200, { orders: listCustomerOrders(url.searchParams.get("phone") || "") });
    return true;
  }

  const orderMatch = url.pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (method === "GET" && orderMatch) {
    const admin = verifyAdminToken(bearer(req));
    const result = getOrder(decodeURIComponent(orderMatch[1]), {
      phone: url.searchParams.get("phone") || "",
      admin,
    });
    send(res, result.ok ? 200 : result.status, result.ok ? { order: result.order } : { error: result.error });
    return true;
  }

  if (method === "POST" && url.pathname === "/api/admin/login") {
    const result = adminLogin(String(body.username || ""), String(body.password || ""));
    send(res, result.ok ? 200 : result.status, result.ok ? { token: result.token } : { error: result.error });
    return true;
  }

  if (method === "GET" && url.pathname === "/api/admin/session") {
    const ok = verifyAdminToken(bearer(req));
    send(res, ok ? 200 : 401, ok ? { ok: true } : { error: "unauthorized" });
    return true;
  }

  if (method === "GET" && url.pathname === "/api/admin/orders") {
    if (!verifyAdminToken(bearer(req))) {
      send(res, 401, { error: "unauthorized" });
      return true;
    }
    send(res, 200, { orders: listAdminOrders() });
    return true;
  }

  const statusMatch = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)\/status$/);
  if (method === "PATCH" && statusMatch) {
    if (!verifyAdminToken(bearer(req))) {
      send(res, 401, { error: "unauthorized" });
      return true;
    }
    const result = updateOrderStatus(decodeURIComponent(statusMatch[1]), String(body.status || ""));
    send(res, result.ok ? 200 : result.status, result.ok ? { order: result.order } : { error: result.error });
    return true;
  }

  if (url.pathname.startsWith("/api/")) {
    send(res, 404, { error: "not_found" });
    return true;
  }
  return false;
}
