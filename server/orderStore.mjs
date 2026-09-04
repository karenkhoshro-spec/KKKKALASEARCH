import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");

/**
 * Runtime data file. The running app uses `data/orders.json`; automated tests
 * set `KALA_ORDERS_FILE` to a temp path so test runs can never pollute (or
 * corrupt) the real store the preview/admin UI is reading from.
 */
export function ordersFilePath() {
  // Production uses ORDER_STORE_PATH (see docs/HOSTINGER_DEPLOYMENT.md) so
  // order data can live on a persistent volume outside dist/. KALA_ORDERS_FILE
  // is kept as a legacy alias (used by older local setups/tests).
  const explicit = process.env.ORDER_STORE_PATH || process.env.KALA_ORDERS_FILE;
  return explicit ? path.resolve(explicit) : path.join(dataDir, "orders.json");
}

/**
 * Secondary runtime files (admin token revocation, …) live next to the orders
 * file so the override keeps every piece of runtime state isolated together.
 */
export function runtimeFilePath(name) {
  return path.join(path.dirname(ordersFilePath()), name);
}

function readJson(file, fallback) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

export function readOrders() {
  return readJson(ordersFilePath(), []);
}

export function writeOrders(orders) {
  writeJson(ordersFilePath(), orders);
}

export function readAdminRevocations() {
  const entries = readJson(runtimeFilePath("admin_revoked.json"), []);
  return Array.isArray(entries) ? entries : [];
}

export function writeAdminRevocations(entries) {
  writeJson(runtimeFilePath("admin_revoked.json"), entries);
}

/** Local-dev override of admin username + scrypt hash (never committed). */
export function readAdminCredentials() {
  const data = readJson(runtimeFilePath("admin_credentials.json"), null);
  if (!data || typeof data !== "object") return null;
  const username = String(data.username || "").trim();
  const passwordHash = String(data.passwordHash || "").trim();
  if (!username || !passwordHash) return null;
  return { username, passwordHash };
}

export function writeAdminCredentials(record) {
  writeJson(runtimeFilePath("admin_credentials.json"), {
    username: String(record.username || ""),
    passwordHash: String(record.passwordHash || ""),
    updatedAt: new Date().toISOString(),
  });
}
