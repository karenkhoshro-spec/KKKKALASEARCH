/**
 * KalaSearch API integration tests (`npm test`).
 * Spawns the real server binary on an ephemeral port with a temp data dir,
 * then exercises every requirement from the spec with real HTTP calls.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const PORT = 8900 + Math.floor(Math.random() * 80);
const BASE = `http://127.0.0.1:${PORT}`;
const TMP_DATA = fs.mkdtempSync(path.join(os.tmpdir(), "ks-test-"));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail = "") {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function startServer() {
  const proc = spawn(process.execPath, [path.join(ROOT, "server", "index.mjs")], {
    env: {
      ...process.env,
      PORT: String(PORT),
      KS_DATA_DIR: TMP_DATA,
      KS_SERVE_DIR: path.join(ROOT, "does-not-exist"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise((resolve, reject) => {
    const onData = (d) => {
      if (String(d).includes("READY")) {
        proc.stdout.off("data", onData);
        resolve(proc);
      }
    };
    proc.stdout.on("data", onData);
    proc.on("exit", (code) => reject(new Error(`server exited early with code ${code}`)));
    setTimeout(() => reject(new Error("server start timeout")), 8000);
  });
}

function stopServer(proc) {
  return new Promise((resolve) => {
    proc.on("exit", () => resolve());
    proc.kill("SIGTERM");
    setTimeout(() => {
      try { proc.kill("SIGKILL"); } catch {}
      resolve();
    }, 2500);
  });
}

async function req(method, url, body, cookie) {
  const headers = {};
  let payload;
  if (body !== undefined) {
    payload = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${url}`, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, json, text, cookie: setCookie ? setCookie.split(";")[0] : null };
}

async function main() {
  console.log(`\n=== KalaSearch API tests (port ${PORT}, data: ${TMP_DATA}) ===\n`);
  let server = await startServer();

  try {
    /* 1. admin login — correct credentials */
    let r = await req("POST", "/api/admin/login", { username: "Karen", password: "mkhoshrou1381" });
    check("1. admin login Karen/mkhoshrou1381 → 200", r.status === 200 && r.json?.ok === true, `status=${r.status}`);
    const adminCookie = r.cookie;
    check("1b. login sets session cookie", !!adminCookie && adminCookie.startsWith("ks_admin="));

    /* session check */
    r = await req("GET", "/api/admin/session", undefined, adminCookie);
    check("1c. GET /api/admin/session with cookie → 200", r.status === 200 && r.json?.username === "Karen");

    /* 2. wrong username */
    r = await req("POST", "/api/admin/login", { username: "Wrong", password: "mkhoshrou1381" });
    check("2. admin login wrong username → 401", r.status === 401, `status=${r.status}`);

    /* 3. wrong password */
    r = await req("POST", "/api/admin/login", { username: "Karen", password: "wrong-pass" });
    check("3. admin login wrong password → 401", r.status === 401, `status=${r.status}`);

    /* 4. POST a real order — White × 2 + Red × 1 must be TWO separate lines */
    r = await req("POST", "/api/orders", {
      customer: {
        name: "مشتری تست کالا سرچ",
        mobile: "09121234567",
        address: "تهران، خیابان آزادی، پلاک ۱۲",
        province: "تهران",
        city: "تهران",
        postal: "1234567890",
        notes: "تحویل عصر",
      },
      items: [
        {
          productId: "p1", name: "ست ظروف نگهداری", productCode: "KS-101", sku: "ASH-101",
          variationId: "white", variationName: "سفید", color: "#ffffff", quantity: 2, unitPrice: 285000,
        },
        {
          productId: "p1", name: "ست ظروف نگهداری", productCode: "KS-101", sku: "ASH-101",
          variationId: "red", variationName: "قرمز", color: "#ef4444", quantity: 1, unitPrice: 285000,
        },
      ],
    });
    check("4. POST /api/orders → 201", r.status === 201 && r.json?.ok === true, `status=${r.status}`);
    const order = r.json?.order;
    check("4b. order number assigned (KS-YYYYMMDD-xxxx)", /^KS-\d{8}-\d{4}$/.test(order?.orderNumber || ""), order?.orderNumber);
    check("4c. White×2 + Red×1 stored as TWO separate lines", order?.items?.length === 2, `lines=${order?.items?.length}`);
    check(
      "4d. line totals correct (285000×2, 285000×1)",
      order?.items?.[0]?.lineTotal === 570000 && order?.items?.[1]?.lineTotal === 285000
    );
    check("4e. server-computed total = 855000", order?.total === 855000, `total=${order?.total}`);
    check("4f. initial status = registered", order?.status === "registered");
    check("4g. paymentStatus separate field, unpaid (no fake payment)", order?.paymentStatus === "unpaid");
    check("4h. color/variation/code/sku persisted", order?.items?.[0]?.variationName === "سفید" && order?.items?.[0]?.productCode === "KS-101" && order?.items?.[0]?.sku === "ASH-101");

    /* second order from a DIFFERENT customer (for isolation test) */
    r = await req("POST", "/api/orders", {
      customer: { name: "مشتری دوم", mobile: "+989355554444" },
      items: [{ productId: "p3", name: "سبد لباس", productCode: "KS-103", sku: "ASH-103", quantity: 1, unitPrice: 410000 }],
    });
    const otherOrder = r.json?.order;
    check("4i. second customer order created", r.status === 201 && !!otherOrder?.id);

    /* GET order by id */
    r = await req("GET", `/api/orders/${order.id}`);
    check("4j. GET /api/orders/:id → the same order", r.status === 200 && r.json?.order?.id === order.id);

    /* GET by orderNumber also works */
    r = await req("GET", `/api/orders/${order.orderNumber}`);
    check("4k. GET /api/orders/:orderNumber works too", r.status === 200 && r.json?.order?.id === order.id);

    /* 5. customer orders isolation */
    r = await req("GET", "/api/customer/orders?mobile=9121234567");
    check(
      "5. GET /api/customer/orders returns ONLY that customer's orders",
      r.status === 200 && r.json?.orders?.length === 1 && r.json.orders[0].id === order.id,
      `count=${r.json?.orders?.length}`
    );
    r = await req("GET", "/api/customer/orders?mobile=09121234567");
    check("5b. mobile normalization (0912… == 912…) filters the same", r.json?.orders?.length === 1);
    r = await req("GET", "/api/customer/orders?mobile=12345");
    check("5c. invalid mobile → 400", r.status === 400);

    /* 6. admin sees the orders */
    r = await req("GET", "/api/admin/orders", undefined, adminCookie);
    check("6. GET /api/admin/orders shows customer order", r.status === 200 && r.json?.orders?.some((o) => o.id === order.id), `count=${r.json?.orders?.length}`);
    check("6b. admin sees second customer's order too", r.json?.orders?.some((o) => o.id === otherOrder.id));
    r = await req("GET", "/api/admin/orders");
    check("6c. GET /api/admin/orders WITHOUT cookie → 401", r.status === 401, `status=${r.status}`);

    /* validation errors */
    r = await req("POST", "/api/orders", { customer: { name: "", mobile: "123" }, items: [] });
    check("6d. invalid order → 400 with errors", r.status === 400);

    /* 7. status change persists across server restart (= refresh and beyond) */
    r = await req("PATCH", `/api/admin/orders/${order.id}/status`, { status: "preparing" }, adminCookie);
    check("7. PATCH status → preparing", r.status === 200 && r.json?.order?.status === "preparing");
    r = await req("PATCH", `/api/admin/orders/${order.id}/status`, { status: "not-a-status" }, adminCookie);
    check("7b. invalid status value → 400", r.status === 400);
    r = await req("PATCH", `/api/admin/orders/${order.id}/status`, { status: "delivered" });
    check("7c. PATCH without admin cookie → 401", r.status === 401);

    // restart the server process, then re-read — file-backed persistence
    await stopServer(server);
    server = await startServer();
    r = await req("POST", "/api/admin/login", { username: "Karen", password: "mkhoshrou1381" });
    const cookie2 = r.cookie;
    r = await req("GET", `/api/orders/${order.id}`);
    check("7d. status survives server restart (persisted in orders.json)", r.json?.order?.status === "preparing", `status=${r.json?.order?.status}`);

    /* 8. order identity integrity — the order's lines map to that exact order */
    r = await req("GET", `/api/orders/${order.id}`);
    const fetched = r.json?.order;
    check(
      "8. fetched order lines match exactly the placed order (same order, 2 lines, same totals)",
      fetched?.orderNumber === order.orderNumber &&
        fetched?.items?.length === 2 &&
        fetched?.total === 855000 &&
        fetched?.customer?.name === "مشتری تست کالا سرچ",
      fetched?.orderNumber
    );

    /* payment status stays separate after status change */
    check("8b. paymentStatus still unpaid while order status changed", fetched?.paymentStatus === "unpaid" && fetched?.status === "preparing");

    /* admin logout kills the session */
    r = await req("POST", "/api/admin/logout", undefined, cookie2);
    r = await req("GET", "/api/admin/orders", undefined, cookie2);
    check("9. after logout, admin API → 401", r.status === 401);

    /* data/orders.json structure on disk */
    const raw = JSON.parse(fs.readFileSync(path.join(TMP_DATA, "orders.json"), "utf8"));
    check("10. on-disk orders.json contains both orders", raw.orders?.length === 2);
  } finally {
    await stopServer(server);
    try { fs.rmSync(TMP_DATA, { recursive: true, force: true }); } catch {}
  }

  console.log(`\n=== RESULT: ${passed} passed, ${failed} failed ===`);
  if (failures.length) {
    console.log("Failed:", failures.join(" | "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("TEST RUNNER ERROR:", err);
  process.exit(1);
});
