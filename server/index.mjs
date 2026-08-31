/**
 * KalaSearch API + static server (zero-dependency Node HTTP server).
 *
 * Endpoints:
 *   POST  /api/orders                    create a customer order (persisted to data/orders.json)
 *   GET   /api/orders/:id                fetch one order (by id or orderNumber)
 *   GET   /api/customer/orders?mobile=.. fetch orders of ONE customer only (filtered by mobile)
 *   POST  /api/admin/login               admin login (Karen / mkhoshrou1381 by default, via env)
 *   POST  /api/admin/logout              clear admin session
 *   GET   /api/admin/session             check admin session
 *   GET   /api/admin/orders              list all orders (auth required)
 *   PATCH /api/admin/orders/:id/status   change order status (auth required, persisted)
 *   GET   /api/health                    readiness probe
 *
 * Storage: JSON file (default ./data/orders.json). Status changes survive restarts.
 * NOTE: `status` (registered/preparing/ready_pickup/shipping/delivered) is the ORDER status.
 *       `paymentStatus` is a completely separate field and is never faked as "paid".
 */
import http from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PORT = Number(process.env.PORT || process.env.KS_PORT || 8787);
const HOST = process.env.HOST || "0.0.0.0";
const DATA_DIR = path.resolve(ROOT, process.env.KS_DATA_DIR || "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const SERVE_DIR = path.resolve(ROOT, process.env.KS_SERVE_DIR || "dist");

const ADMIN_USERNAME = process.env.KS_ADMIN_USER || "Karen";
const ADMIN_PASSWORD = process.env.KS_ADMIN_PASS || "mkhoshrou1381";

export const ORDER_STATUSES = ["registered", "preparing", "ready_pickup", "shipping", "delivered"];
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

/* ------------------------------- storage ------------------------------- */

let writeChain = Promise.resolve();

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify({ orders: [] }, null, 2));
}

async function readOrders() {
  ensureDataFile();
  try {
    const raw = await fsp.readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.orders) ? parsed.orders : [];
  } catch {
    return [];
  }
}

function persistOrders(next) {
  // Serialize writes so concurrent requests can't clobber each other.
  writeChain = writeChain
    .then(async () => {
      ensureDataFile();
      const tmp = `${ORDERS_FILE}.${randomBytes(4).toString("hex")}.tmp`;
      await fsp.writeFile(tmp, JSON.stringify({ orders: next }, null, 2));
      await fsp.rename(tmp, ORDERS_FILE);
    })
    .catch(() => {});
  return writeChain;
}

/* ------------------------------- sessions ------------------------------- */

/** @type {Map<string, {username:string, expires:number}>} */
const sessions = new Map();

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    // Still burn a comparison of equal length to keep timing flat-ish.
    timingSafeEqual(bb, bb);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

function createSession(username) {
  const token = randomBytes(24).toString("hex");
  sessions.set(token, { username, expires: Date.now() + SESSION_TTL_MS });
  return token;
}

function getSession(req) {
  const cookie = req.headers.cookie || "";
  const m = /(?:^|;\s*)ks_admin=([a-f0-9]+)/.exec(cookie);
  if (!m) return null;
  const s = sessions.get(m[1]);
  if (!s) return null;
  if (Date.now() > s.expires) {
    sessions.delete(m[1]);
    return null;
  }
  return { token: m[1], ...s };
}

/* -------------------------------- helpers -------------------------------- */

function normalizeMobile(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.startsWith("0098")) return digits.slice(4);
  if (digits.startsWith("98")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

function isValidMobile(local) {
  return /^9\d{9}$/.test(local);
}

function todayCompact() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function json(res, status, body, extraHeaders = {}) {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": buf.length,
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(buf);
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sanitizeItem(raw, idx) {
  const quantity = Number(raw.quantity);
  const unitPrice = Number(raw.unitPrice);
  if (!Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: `item[${idx}]: quantity must be >=1 and unitPrice >= 0` };
  }
  const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  return {
    value: {
      productId: str(raw.productId) ?? `unknown-${idx + 1}`,
      name: str(raw.name) ?? `item-${idx + 1}`,
      productCode: str(raw.productCode),
      sku: str(raw.sku),
      model: str(raw.model),
      image: str(raw.image),
      variationId: str(raw.variationId),
      variationName: str(raw.variationName),
      color: str(raw.color),
      quantity: Math.floor(quantity),
      unitPrice: Math.round(unitPrice),
    },
  };
}

/* --------------------------------- API --------------------------------- */

async function handleApi(req, res, pathname, query) {
  // CORS (dev-friendly; the SPA talks same-origin through the vite proxy)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }

  if (pathname === "/api/health") {
    json(res, 200, { ok: true, service: "kalasearch-api" });
    return true;
  }

  /* ---------- customer: create order ---------- */
  if (pathname === "/api/orders" && req.method === "POST") {
    const body = await readBody(req);
    const c = body.customer || {};
    const name = String(c.name || "").trim();
    const mobile = normalizeMobile(c.mobile);
    const errors = [];
    if (!name) errors.push("customer.name is required");
    if (!isValidMobile(mobile)) errors.push("customer.mobile must be a valid Iranian mobile number");
    if (!Array.isArray(body.items) || body.items.length === 0) errors.push("items must be a non-empty array");
    let items = [];
    if (Array.isArray(body.items)) {
      for (let i = 0; i < body.items.length; i++) {
        const r = sanitizeItem(body.items[i], i);
        if (r.error) {
          errors.push(r.error);
          break;
        }
        items.push(r.value);
      }
    }
    if (errors.length) {
      json(res, 400, { ok: false, error: errors.join("; ") });
      return true;
    }

    items = items.map((it) => ({ ...it, lineTotal: it.unitPrice * it.quantity }));
    const total = items.reduce((s, it) => s + it.lineTotal, 0);

    const orders = await readOrders();
    const day = todayCompact();
    const seq = orders.filter((o) => String(o.orderNumber || "").includes(`KS-${day}-`)).length + 1;
    let orderNumber = `KS-${day}-${String(seq).padStart(4, "0")}`;
    while (orders.some((o) => o.orderNumber === orderNumber)) {
      orderNumber = `KS-${day}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    }

    const order = {
      id: `ord_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: "registered",
      paymentStatus: "unpaid", // separate from order status; never faked
      lang: typeof body.lang === "string" ? body.lang : "fa",
      customer: {
        name,
        mobile, // normalized local: 9xxxxxxxxx
        mobileFull: `+98${mobile}`,
        address: String(c.address || "").trim() || undefined,
        province: String(c.province || "").trim() || undefined,
        city: String(c.city || "").trim() || undefined,
        postal: String(c.postal || "").replace(/\D/g, "") || undefined,
        notes: String(c.notes || "").trim() || undefined,
      },
      items,
      total,
    };

    const next = [order, ...orders];
    await persistOrders(next);
    json(res, 201, { ok: true, order });
    return true;
  }

  /* ---------- customer / generic: get one order ---------- */
  let m = /^\/api\/orders\/([^/]+)$/.exec(pathname);
  if (m && req.method === "GET") {
    const key = decodeURIComponent(m[1]);
    const orders = await readOrders();
    const order = orders.find((o) => o.id === key || o.orderNumber === key);
    if (!order) {
      json(res, 404, { ok: false, error: "order not found" });
      return true;
    }
    json(res, 200, { ok: true, order });
    return true;
  }

  /* ---------- customer: list ONLY my orders ---------- */
  if (pathname === "/api/customer/orders" && req.method === "GET") {
    const mobile = normalizeMobile(query.get("mobile"));
    if (!isValidMobile(mobile)) {
      json(res, 400, { ok: false, error: "valid mobile query parameter required" });
      return true;
    }
    const orders = await readOrders();
    const mine = orders
      .filter((o) => normalizeMobile(o.customer?.mobile) === mobile)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    json(res, 200, { ok: true, orders: mine });
    return true;
  }

  /* ---------- admin: login ---------- */
  if (pathname === "/api/admin/login" && req.method === "POST") {
    const body = await readBody(req);
    const username = String(body.username || "");
    const password = String(body.password || "");
    const userOk = safeEqual(username, ADMIN_USERNAME);
    const passOk = safeEqual(password, ADMIN_PASSWORD);
    if (!(userOk && passOk)) {
      json(res, 401, { ok: false, error: "invalid credentials" });
      return true;
    }
    const token = createSession(ADMIN_USERNAME);
    res.setHeader(
      "Set-Cookie",
      `ks_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`
    );
    json(res, 200, { ok: true, username: ADMIN_USERNAME });
    return true;
  }

  if (pathname === "/api/admin/logout" && req.method === "POST") {
    const session = getSession(req);
    if (session) sessions.delete(session.token);
    res.setHeader("Set-Cookie", "ks_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    json(res, 200, { ok: true });
    return true;
  }

  /* ---------- admin: session check ---------- */
  if (pathname === "/api/admin/session" && req.method === "GET") {
    const session = getSession(req);
    if (!session) {
      json(res, 401, { ok: false });
      return true;
    }
    json(res, 200, { ok: true, username: session.username });
    return true;
  }

  /* ---------- admin: list orders ---------- */
  if (pathname === "/api/admin/orders" && req.method === "GET") {
    const session = getSession(req);
    if (!session) {
      json(res, 401, { ok: false, error: "unauthorized" });
      return true;
    }
    const orders = await readOrders();
    const status = query.get("status");
    const list = (status ? orders.filter((o) => o.status === status) : orders)
      .slice()
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    json(res, 200, { ok: true, orders: list });
    return true;
  }

  /* ---------- admin: change order status ---------- */
  m = /^\/api\/admin\/orders\/([^/]+)\/status$/.exec(pathname);
  if (m && req.method === "PATCH") {
    const session = getSession(req);
    if (!session) {
      json(res, 401, { ok: false, error: "unauthorized" });
      return true;
    }
    const body = await readBody(req);
    const status = String(body.status || "");
    if (!ORDER_STATUSES.includes(status)) {
      json(res, 400, { ok: false, error: `status must be one of: ${ORDER_STATUSES.join(", ")}` });
      return true;
    }
    const key = decodeURIComponent(m[1]);
    const orders = await readOrders();
    const idx = orders.findIndex((o) => o.id === key || o.orderNumber === key);
    if (idx === -1) {
      json(res, 404, { ok: false, error: "order not found" });
      return true;
    }
    const updated = {
      ...orders[idx],
      status,
      statusHistory: [...(orders[idx].statusHistory || []), { status, at: new Date().toISOString(), by: session.username }],
    };
    orders[idx] = updated;
    await persistOrders(orders);
    json(res, 200, { ok: true, order: updated });
    return true;
  }

  return false; // not an API route
}

/* ------------------------------- static ------------------------------- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

async function serveStatic(res, pathname) {
  let filePath = path.join(SERVE_DIR, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(SERVE_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch {
    // SPA fallback: unknown paths render the app
    filePath = path.join(SERVE_DIR, "index.html");
  }
  try {
    const data = await fsp.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": data.length,
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found (build the frontend with `npm run build` first)");
  }
}

/* -------------------------------- server ------------------------------- */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;
  try {
    if (pathname.startsWith("/api/")) {
      let handled = false;
      try {
        handled = await handleApi(req, res, pathname, url.searchParams);
      } catch (err) {
        json(res, err?.message === "body too large" ? 413 : 400, { ok: false, error: err?.message || "bad request" });
        return;
      }
      if (handled) return;
      json(res, 404, { ok: false, error: "unknown API route" });
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    await serveStatic(res, pathname);
  } catch (err) {
    json(res, 500, { ok: false, error: err?.message || "internal error" });
  }
});

server.listen(PORT, HOST, () => {
  const addr = server.address();
  console.log(`READY kalasearch-api listening on port ${addr.port} (static: ${SERVE_DIR}, data: ${ORDERS_FILE})`);
});

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  });
}
