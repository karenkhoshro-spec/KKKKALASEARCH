import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
// Importing the handler loads the project `.env` into this worker (the same
// mechanism the other server tests rely on) so admin credentials are known.
import "../server/orderHandler.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// This suite exercises the REAL production entry (`node server/index.mjs`)
// with no Vite anywhere in the process. It needs a built dist/ — skip when
// `npm run build` has not been run yet.
const hasDist = existsSync(join(ROOT, "dist", "index.html"));
const hasCreds = Boolean(
  process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET,
);

const storeFile = join(mkdtempSync(join(tmpdir(), "kala-prod-server-")), "orders.json");

let child: ChildProcessWithoutNullStreams | null = null;
let baseUrl = "";
let bootLog = "";

function startServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    bootLog = "";
    let settled = false;
    const proc = spawn(process.execPath, ["server/index.mjs"], {
      cwd: ROOT,
      env: { ...process.env, PORT: "0", HOST: "127.0.0.1", ORDER_STORE_PATH: storeFile },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child = proc;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`timed out starting production server:\n${bootLog}`));
      }
    }, 15000);

    proc.stdout.on("data", (chunk: Buffer) => {
      bootLog += chunk.toString();
      const match = bootLog.match(/listening on http:\/\/127\.0\.0\.1:(\d+)/);
      if (match && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      bootLog += chunk.toString();
    });
    proc.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`production server exited early (code ${code}):\n${bootLog}`));
      }
    });
  });
}

function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    const proc = child;
    child = null;
    if (!proc || proc.exitCode !== null) {
      resolve();
      return;
    }
    proc.once("exit", () => resolve());
    proc.kill("SIGTERM");
    const force = setTimeout(() => {
      if (proc.exitCode === null) proc.kill("SIGKILL");
    }, 6000);
    force.unref();
  });
}

async function request(pathname: string, init?: RequestInit) {
  return fetch(`${baseUrl}${pathname}`, init);
}

const orderPayload = {
  customer: {
    name: "کاربر تولید",
    phone: "09359998877",
    province: "تهران",
    city: "تهران",
    address: "خیابان سرور، پلاک ۱",
    postalCode: "1122334455",
  },
  items: [
    {
      productId: "8039010",
      productCode: "8039010",
      sku: "803901003",
      name: "سرویس لگن اپل تاپ (4عددی)",
      model: "سرویس لگن اپل تاپ (4عددی)",
      variation: "سفید",
      color: "سفید",
      quantity: 2,
      unitPrice: 346000,
      price: 346000,
      image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
    },
  ],
};

describe.skipIf(!hasDist)("production server — node server/index.mjs (no Vite)", () => {
  let orderNumber = "";

  beforeAll(async () => {
    baseUrl = await startServer();
  }, 20000);

  afterAll(async () => {
    await stopServer();
  });

  it("GET /api/health returns { ok: true }", async () => {
    const res = await request("/api/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("serves the built frontend on /", async () => {
    const res = await request("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("cache-control")).toContain("no-cache");
    expect(await res.text()).toContain("کالا سرچ");
  });

  it("serves the SPA shell for a frontend route (SPA fallback)", async () => {
    const res = await request("/product/8039010");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(await res.text()).toContain("<div id=\"root\">");
  });

  it("returns 404 for a missing file-like asset (never the HTML shell)", async () => {
    const res = await request("/assets/nope-404.png");
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("not_found");
  });

  it("returns JSON 404 for unknown /api routes", async () => {
    const res = await request("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("rejects admin orders without a token (401)", async () => {
    const res = await request("/api/admin/orders");
    expect(res.status).toBe(401);
  });

  it("creates a persistent order through the real production API", async () => {
    const res = await request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { order: { orderNumber: string; total: number } };
    orderNumber = data.order.orderNumber;
    expect(orderNumber).toMatch(/^KS-/);
    expect(data.order.total).toBe(692000);
  });

  it.skipIf(!hasCreds)("admin login works and the new order is listed with its image", async () => {
    const loginRes = await request("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }),
    });
    expect(loginRes.status).toBe(200);
    const { token } = (await loginRes.json()) as { token: string };
    expect(typeof token).toBe("string");

    const listRes = await request("/api/admin/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.status).toBe(200);
    const { orders } = (await listRes.json()) as {
      orders: Array<{ orderNumber: string; items: Array<{ image: string; name: string }> }>;
    };
    const found = orders.find((order) => order.orderNumber === orderNumber);
    expect(found).toBeTruthy();
    expect(found?.items[0].image).toContain("4030.jpg");
    expect(found?.items[0].name).toContain("سرویس لگن");
  });

  it("keeps customer order lookup isolated by phone", async () => {
    const res = await request(`/api/orders/${encodeURIComponent(orderNumber)}?phone=09120000000`);
    expect(res.status).toBe(404);
  });
});

describe.skipIf(!hasDist || !hasCreds)("production server — persistence across restart", () => {
  let orderNumber = "";

  beforeAll(async () => {
    baseUrl = await startServer();
    const res = await request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const data = (await res.json()) as { order: { orderNumber: string } };
    orderNumber = data.order.orderNumber;

    const login = await request("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }),
    });
    const { token } = (await login.json()) as { token: string };
    const patch = await request(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: "delivered" }),
    });
    expect(patch.status).toBe(200);

    // Kill the process — the order must survive the restart.
    await stopServer();
    baseUrl = await startServer();
  }, 30000);

  afterAll(async () => {
    await stopServer();
  });

  it("order + delivered status survive a full server restart", async () => {
    const login = await request("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }),
    });
    const { token } = (await login.json()) as { token: string };

    const res = await request("/api/admin/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const { orders } = (await res.json()) as {
      orders: Array<{ orderNumber: string; status: string; total: number }>;
    };
    const found = orders.find((order) => order.orderNumber === orderNumber);
    expect(found).toBeTruthy();
    expect(found?.status).toBe("delivered");
    expect(found?.total).toBe(692000);
  });
});
