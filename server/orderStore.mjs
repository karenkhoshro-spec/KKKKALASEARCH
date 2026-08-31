import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const ordersFile = path.join(dataDir, "orders.json");

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
