import { mkdirSync, rmSync } from "fs";
import path from "path";

const file = path.resolve(process.cwd(), "node_modules/.tmp/kala-test-orders.json");

/** Each run starts from an empty scratch store so tests never see leftovers. */
export function setup() {
  mkdirSync(path.dirname(file), { recursive: true });
  rmSync(file, { force: true });
}

export function teardown() {
  rmSync(file, { force: true });
}
