import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  readOrders,
  writeOrders,
  readAdminRevocations,
  writeAdminRevocations,
} from "./orderStore.mjs";

const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Maximum accepted JSON request body size (protects the API from abuse). */
const MAX_BODY_BYTES = 512 * 1024;

/**
 * Real product image mapping (src/data/productImages.json): productId -> real
 * image URL. Loaded lazily once and used only to fill in images that are
 * missing on an order item (old orders / manual API calls). Stored item.image
 * always wins.
 */
let productImageMapping = null;
function imageMappingForCode(code) {
  if (productImageMapping === null) {
    productImageMapping = {};
    try {
      const raw = fs.readFileSync(path.join(PROJECT_ROOT, "src", "data", "productImages.json"), "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") productImageMapping = parsed;
    } catch {
      /* mapping file missing — enrichment disabled */
    }
  }
  const digits = String(code || "").replace(/\D/g, "");
  if (!digits) return "";
  const mapped = productImageMapping[digits];
  return mapped && typeof mapped === "string" ? mapped : "";
}

export const ORDER_STATUSES = ["registered", "preparing", "ready_pickup", "shipping", "delivered"];
export const PAYMENT_STATUSES = ["unpaid"];

function loadDotEnv() {
  try {
    const envPath = path.join(PROJECT_ROOT, ".env");
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

/** Owner (Hiboss) credentials — optional, entirely backend-only. */
function ownerUser() {
  return process.env.OWNER_USERNAME || "";
}

function ownerPass() {
  return process.env.OWNER_PASSWORD || "";
}

function decodeTokenPayload(token) {
  const [payload] = String(token || "").split(".");
  if (!payload) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof data === "object" && data !== null ? data : null;
  } catch {
    return null;
  }
}

function signToken(user, role) {
  const secret = adminSecret();
  if (!secret || !user) return "";
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ u: user, r: role, exp, jti: crypto.randomBytes(9).toString("base64url") }),
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function signAdminToken() {
  return signToken(adminUser(), "admin");
}

export function signOwnerToken() {
  return signToken(ownerUser(), "owner");
}

/**
 * Role carried by a VALID admin/owner token ("admin" | "owner" | "").
 * Callers must verify the token first with {@link verifyAdminToken}.
 */
export function tokenRole(token) {
  const data = decodeTokenPayload(token);
  if (!data) return "";
  return data.r === "owner" ? "owner" : "admin";
}

export function verifyAdminToken(token) {
  if (!token || !adminSecret()) return false;
  const [payload, sig] = String(token).split(".");
  if (!payload || !sig) return false;
  const expected = crypto.createHmac("sha256", adminSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  // Accepted identities: the configured admin, or the configured owner
  // (owner tokens are signed with role "owner" and are a superset of admin).
  const isAdmin = data.u === adminUser() && (data.r === "admin" || data.r === undefined);
  const isOwner = data.u === ownerUser() && data.r === "owner" && ownerUser() !== "";
  if ((!isAdmin && !isOwner) || Number(data.exp) <= Date.now()) return false;
  // Reject tokens that were explicitly revoked by logout.
  const now = Date.now();
  const revoked = readAdminRevocations().filter((entry) => Number(entry?.exp) > now);
  if (data.jti && revoked.some((entry) => entry.jti === data.jti)) return false;
  return true;
}

/**
 * Revokes a single admin session token. Logout invalidates that token server-
 * side immediately (and permanently, even across server restarts); every other
 * signed token stays valid. Returns true when the token was actually revoked.
 */
export function revokeAdminToken(token) {
  const data = decodeTokenPayload(token);
  if (!data || !data.jti) return false;
  const now = Date.now();
  const revoked = readAdminRevocations().filter((entry) => Number(entry?.exp) > now);
  if (!revoked.some((entry) => entry.jti === data.jti)) {
    revoked.push({ jti: data.jti, exp: Number(data.exp) || now + 7 * 24 * 60 * 60 * 1000 });
    writeAdminRevocations(revoked);
  }
  return true;
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

/**
 * Owner (Hiboss) login. Separate, backend-only OWNER_USERNAME/OWNER_PASSWORD;
 * when they are not configured the endpoint answers 503 and the Hiboss panel
 * stays locked (no fallback to admin credentials, no public backdoor).
 */
export function ownerLogin(username, password) {
  const user = ownerUser();
  const pass = ownerPass();
  if (!user || !pass || !adminSecret()) {
    return { ok: false, status: 503, error: "owner_not_configured" };
  }
  if (username !== user || password !== pass) {
    return { ok: false, status: 401, error: "invalid_credentials" };
  }
  return { ok: true, token: signOwnerToken() };
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

const MAX_LEN = {
  name: 200,
  code: 200,
  sku: 200,
  variation: 120,
  notes: 2000,
  address: 600,
  city: 120,
  province: 120,
  email: 254,
  image: 2048,
};

function clampLen(value, key) {
  return String(value || "").trim().slice(0, MAX_LEN[key] ?? 200);
}

/** True when a raw order-item payload is sane enough to be persisted. */
function isValidOrderItem(item) {
  if (!item || typeof item !== "object") return false;
  const hasCode = String(item.productCode || item.productId || item.sku || "").trim().length > 0;
  if (!hasCode) return false;
  const hasName = String(item.name || item.model || "").trim().length > 0;
  if (!hasName) return false;
  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) return false;
  const unitPrice = Number(item.unitPrice ?? item.price);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return false;
  return true;
}

function publicItem(item) {
  const unitPrice = Number(item.unitPrice ?? item.price) || 0;
  const quantity = Math.max(1, Number(item.quantity) || 1);
  const name = String(item.name || item.model || "");
  const storedImage = String(item.image || "").trim();
  const resolvedImage =
    storedImage || imageMappingForCode(item.productCode || item.productId || item.sku || "");
  return {
    productId: String(item.productId || "").slice(0, MAX_LEN.code),
    productCode: clampLen(item.productCode, "code"),
    sku: clampLen(item.sku, "sku"),
    name: clampLen(name, "name"),
    model: clampLen(item.model || name, "name"),
    variation: clampLen(item.variation, "variation"),
    color: clampLen(item.color, "variation"),
    quantity,
    image: storedImage ? storedImage.slice(0, MAX_LEN.image) : resolvedImage,
    unitPrice,
    price: unitPrice,
    lineTotal: unitPrice * quantity,
  };
}

function publicOrder(order) {
  if (!order) return null;
  const orderNumber = order.orderNumber;
  return {
    orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    statusUpdatedAt: order.statusUpdatedAt,
    paymentStatus: order.paymentStatus || "unpaid",
    customer: {
      name: order.customer?.name || "",
      phone: order.customer?.phone || "",
      email: order.customer?.email || "",
      province: order.customer?.province || "",
      city: order.customer?.city || "",
      address: order.customer?.address || "",
      postalCode: order.customer?.postalCode || "",
      notes: order.customer?.notes || "",
    },
    items: Array.isArray(order.items) ? order.items.map(publicItem) : [],
    total: order.total,
    document: order.document || {
      kind: "proforma",
      filename: `${orderNumber}.pdf`,
      generatedAt: order.createdAt,
      available: true,
    },
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
  const email = String(customer.email || "").trim();
  const items = Array.isArray(payload?.items) ? payload.items : [];

  // Required checkout fields (frontend collects only these today). Province,
  // postal code and email were removed from the customer form — legacy clients
  // may still send them, and the server accepts them, but they are optional.
  if (!name) return { ok: false, status: 400, error: "name_required" };
  if (!phone) return { ok: false, status: 400, error: "invalid_phone" };
  if (!city) return { ok: false, status: 400, error: "city_required" };
  if (!address) return { ok: false, status: 400, error: "address_required" };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "invalid_email" };
  }
  if (items.length === 0) return { ok: false, status: 400, error: "items_required" };
  if (items.length > 100) return { ok: false, status: 400, error: "too_many_items" };
  if (!items.every(isValidOrderItem)) return { ok: false, status: 400, error: "items_invalid" };

  // Server is the source of truth for money: row totals and the grand total
  // are always recomputed from unit price × quantity, never trusted from the
  // client payload.
  const normalizedItems = items.map(publicItem);
  const computed = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const orders = readOrders();
  const createdAt = new Date().toISOString();
  const orderNumber = generateOrderNumber(orders);
  const order = {
    orderNumber,
    createdAt,
    status: "registered",
    paymentStatus: "unpaid",
    customer: {
      name: clampLen(name, "name"),
      phone,
      email: clampLen(email, "email"),
      province: clampLen(province, "province"),
      city: clampLen(city, "city"),
      address: clampLen(address, "address"),
      postalCode,
      notes: clampLen(notes, "notes"),
    },
    items: normalizedItems,
    total: computed,
    document: {
      kind: "proforma",
      filename: `${orderNumber}.pdf`,
      generatedAt: createdAt,
      available: true,
    },
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

/** Reads the request body, failing fast when it exceeds the size cap. */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let done = false;
    req.on("data", (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        done = true;
        req.removeAllListeners("data");
        req.removeAllListeners("end");
        reject({ tooLarge: true });
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!done) resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", (error) => reject(error));
  });
}

export async function handleApiRequest(req, res) {
  const url = new URL(req.url || "/", "http://local.invalid");
  const method = (req.method || "GET").toUpperCase();

  if (method === "OPTIONS" && url.pathname.startsWith("/api/")) {
    res.statusCode = 204;
    res.end();
    return true;
  }

  // Lightweight liveness/health check for hosting platforms and load balancers.
  if (method === "GET" && url.pathname === "/api/health") {
    send(res, 200, { ok: true });
    return true;
  }

  let raw = "";
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    try {
      raw = await readBody(req);
    } catch (error) {
      if (error && error.tooLarge) {
        send(res, 413, { error: "payload_too_large" });
        return true;
      }
      send(res, 500, { error: "server_error" });
      return true;
    }
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

  if (method === "POST" && url.pathname === "/api/admin/owner-login") {
    const result = ownerLogin(String(body.username || ""), String(body.password || ""));
    send(res, result.ok ? 200 : result.status, result.ok ? { token: result.token, role: "owner" } : { error: result.error });
    return true;
  }

  if (method === "POST" && url.pathname === "/api/admin/logout") {
    const token = bearer(req);
    if (!verifyAdminToken(token)) {
      send(res, 401, { error: "unauthorized" });
      return true;
    }
    revokeAdminToken(token);
    send(res, 200, { ok: true });
    return true;
  }

  if (method === "GET" && url.pathname === "/api/admin/session") {
    const token = bearer(req);
    const ok = verifyAdminToken(token);
    send(res, ok ? 200 : 401, ok ? { ok: true, role: tokenRole(token) } : { error: "unauthorized" });
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
