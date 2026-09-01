import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
// ORDERS_FILE lets tests and CI use a scratch store instead of the live preview data.
const ordersFile = process.env.ORDERS_FILE
  ? path.resolve(process.env.ORDERS_FILE)
  : path.join(root, "data", "orders.json");
const dataDir = path.dirname(ordersFile);

export function readOrders() {
  try {
    const raw = fs.readFileSync(ordersFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeOrders(orders) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tmp = `${ordersFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(orders, null, 2));
  fs.renameSync(tmp, ordersFile);
}
