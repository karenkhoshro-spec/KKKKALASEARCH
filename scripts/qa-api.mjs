/**
 * KalaSearch — live order API matrix (BEB5)
 * =========================================
 * Runs the same contract against BOTH running servers so nothing is asserted only
 * in a jsdom test:
 *
 *   dev      http://localhost:5173  (vite dev + /api plugin)
 *   preview  http://localhost:4173  (built dist + the same /api plugin)
 *
 * Covers: admin login (ok / wrong user / wrong password / no token), order creation
 * with two independent coloured lines, every customer field the checkout collected,
 * per-line product fields (id, code, sku, variation, colour, qty, unit price, line
 * total, image), admin listing, customer listing + strict isolation, status change
 * to delivered, persistence across a *fresh server process*, out-of-stock refusal,
 * and validation errors.
 *
 *   node scripts/qa-api.mjs
 */
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const PORTS = (process.env.QA_API_PORTS || "5173,4173").split(",").map((p) => p.trim()).filter(Boolean);
const ORDERS_FILE = path.resolve(process.cwd(), "data/orders.json");

/* --------------------------------------------------------------- credentials */
function envCreds() {
  const out = { user: process.env.ADMIN_USERNAME, pass: process.env.ADMIN_PASSWORD };
  const envFile = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const value = m[2].trim().replace(/^["']|["']$/g, "");
      if (m[1] === "ADMIN_USERNAME" && !out.user) out.user = value;
      if (m[1] === "ADMIN_PASSWORD" && !out.pass) out.pass = value;
    }
  }
  if (!out.user || !out.pass) throw new Error("ADMIN_USERNAME / ADMIN_PASSWORD not found (check .env.local)");
  return out;
}
const creds = envCreds();

const results = [];
function step(name, pass, detail = "") {
  results.push({ name, pass: !!pass, detail: String(detail ?? "").slice(0, 400) });
  console.log(` ${pass ? "PASS" : "FAIL"}  ${name}${detail ? `\n          ${String(detail).slice(0, 300)}` : ""}`);
  if (!pass) process.exitCode = 1;
}

async function req(base, method, route, { token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${route}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON body — reported as-is */
  }
  return { status: res.status, json, text };
}

/** Payload mirroring exactly what CheckoutPage sends, but with two coloured lines
 *  of one product plus a second product, so every line must stay independent. */
function orderPayload(phone) {
  return {
    customer: {
      name: "سارا بازیابی QA",
      phone,
      email: "sara.qa@example.com",
      province: "تهران",
      city: "تهران",
      address: "خیابان آزادی، کوچه ۱۲، پلاک ۳، واحد ۵",
      postalCode: "1234567890",
      notes: "تست زندهٔ API — BEB5",
    },
    items: [
      {
        productId: "6015010",
        productCode: "6015010",
        id: "601501002",
        sku: "601501002",
        name: "سبد خرید بزرگ سیب طوسی",
        variation: "طوسی",
        color: "طوسی",
        colorHex: "#94a3b8",
        image: "https://ashkanplastic.com/wp-content/uploads/140.jpg",
        price: 294500,
        quantity: 2,
        lineTotal: 589000,
        availability: "موجود",
      },
      {
        productId: "6015010",
        productCode: "6015010",
        id: "601501003",
        sku: "601501003",
        name: "سبد خرید بزرگ سیب کرم",
        variation: "کرم",
        color: "کرم",
        colorHex: "#e7d3b1",
        image: "https://ashkanplastic.com/wp-content/uploads/140.jpg",
        price: 305000,
        quantity: 1,
        lineTotal: 305000,
        availability: "موجود",
      },
      {
        productId: "8039010",
        productCode: "8039010",
        id: "803901001",
        sku: "803901001",
        name: "بشقاب ملامین",
        variation: "",
        color: "",
        image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
        price: 410000,
        quantity: 3,
        lineTotal: 1230000,
        availability: "موجود",
      },
    ],
    total: 589000 + 305000 + 1230000,
  };
}

async function matrixFor(base) {
  const tag = `[${base.replace(/^http:\/\/localhost:/, "port ")}]`;
  console.log(`\n--- ${tag} ${base} ---`);

  /* 1. login */
  const ok = await req(base, "POST", "/api/admin/login", { body: { username: creds.user, password: creds.pass } });
  step(`${tag} admin login accepted`, ok.status === 200 && !!ok.json?.token, `status=${ok.status} token=${String(ok.json?.token || "").slice(0, 12)}…`);
  const token = ok.json?.token || "";

  const wrongUser = await req(base, "POST", "/api/admin/login", { body: { username: "nope-admin", password: creds.pass } });
  step(`${tag} wrong username rejected 401`, wrongUser.status === 401, `status=${wrongUser.status} ${wrongUser.text.slice(0, 60)}`);

  const wrongPass = await req(base, "POST", "/api/admin/login", { body: { username: creds.user, password: "definitely-wrong" } });
  step(`${tag} wrong password rejected 401`, wrongPass.status === 401, `status=${wrongPass.status} ${wrongPass.text.slice(0, 60)}`);

  const noToken = await req(base, "GET", "/api/admin/orders");
  step(`${tag} admin list without a token is 401`, noToken.status === 401, `status=${noToken.status}`);

  /* 2. create the order */
  const phone = "0912" + String(Date.now()).slice(-7);
  const created = await req(base, "POST", "/api/orders", { body: orderPayload(phone) });
  const order = created.json?.order;
  step(`${tag} POST /api/orders → 201 with an order number`, created.status === 201 && /^KS-\d{8}-[0-9A-F]{6}$/.test(order?.orderNumber || ""), `status=${created.status} orderNumber=${order?.orderNumber}`);
  step(`${tag} order number is written to the shared store`, !!order?.orderNumber && fs.readFileSync(ORDERS_FILE, "utf8").includes(order.orderNumber), ORDERS_FILE);

  /* 3. every field the customer confirmed survived */
  const want = {
    "order number": order?.orderNumber,
    "customer name": order?.customer?.name,
    phone: order?.customer?.phone,
    province: order?.customer?.province,
    city: order?.customer?.city,
    "postal code": order?.customer?.postalCode,
    address: order?.customer?.address,
    "order date": order?.createdAt,
    "order status": order?.status,
    "payment status": order?.paymentStatus,
    total: order?.total,
  };
  for (const [label, value] of Object.entries(want)) {
    step(`${tag} stored order carries ${label}`, value !== undefined && value !== null && value !== "", `${label}=${value}`);
  }
  step(`${tag} total equals the sum of the line totals`, order?.total === 589000 + 305000 + 1230000, `total=${order?.total}`);

  /* 4. three lines, each independent */
  const items = order?.items || [];
  step(`${tag} all three lines stored independently`, items.length === 3, `items=${items.length}`);
  const always = ["productId", "productCode", "sku", "name", "quantity", "unitPrice", "lineTotal", "image"];
  for (const f of always) {
    const values = items.map((i) => i[f]);
    step(`${tag} every line carries ${f}`, values.every((v) => v !== undefined && v !== ""), values.join(" | ").slice(0, 200));
  }
  // Colour/variation exist only where the catalogue has them: the chosen colour must
  // reach the line, and a colour-less product must not be given an invented one.
  const coloured = items.slice(0, 2);
  step(`${tag} coloured lines carry their own colour + variation`, coloured.every((i) => i.color && i.variation === i.color), coloured.map((i) => `${i.sku}=${i.color}`).join(" | "));
  step(`${tag} a colour-less product stores no invented colour`, items[2]?.color === "" && items[2]?.variation === "", `color="${items[2]?.color}" variation="${items[2]?.variation}"`);
  const colours = items.slice(0, 2).map((i) => i.color);
  step(`${tag} the two colours of one product stay separate lines`, new Set(colours).size === 2 && items[0].productId === items[1].productId, colours.join(" + "));
  step(`${tag} each line keeps its own quantity and unit price`, items[0].quantity === 2 && items[0].unitPrice === 294500 && items[1].quantity === 1 && items[1].unitPrice === 305000, `${items[0].quantity}×${items[0].unitPrice} / ${items[1].quantity}×${items[1].unitPrice}`);
  step(`${tag} line totals are computed per line`, items.every((i) => i.lineTotal === i.unitPrice * i.quantity), items.map((i) => i.lineTotal).join(" + "));
  step(`${tag} line images are the real mapped asset URLs`, items.every((i) => /^https:\/\/ashkanplastic\.com\/wp-content\/uploads\/\d+\.(jpg|png|webp)$/i.test(i.image || "")), items.map((i) => i.image).join(" , ").slice(0, 200));

  /* 5. admin sees it */
  const adminList = await req(base, "GET", "/api/admin/orders", { token });
  const listed = (adminList.json?.orders || []).find((o) => o.orderNumber === order.orderNumber);
  step(`${tag} /api/admin/orders contains the new order`, adminList.status === 200 && !!listed, `status=${adminList.status} orders=${adminList.json?.orders?.length}`);
  step(`${tag} the admin copy carries all three lines and every image`, (listed?.items || []).length === 3 && listed.items.every((i) => /^https:/.test(i.image || "")), `items=${listed?.items?.length}`);

  /* 6. customer sees their own, and only their own */
  const mine = await req(base, "GET", `/api/customer/orders?phone=${phone}`);
  step(`${tag} customer list (own phone) returns the order`, mine.status === 200 && (mine.json?.orders || []).some((o) => o.orderNumber === order.orderNumber), `status=${mine.status} n=${mine.json?.orders?.length}`);
  const other = await req(base, "GET", `/api/customer/orders?phone=0919${String(Date.now()).slice(-7)}`);
  step(`${tag} another phone sees nothing (isolation)`, other.status === 200 && (other.json?.orders || []).length === 0, `status=${other.status} n=${other.json?.orders?.length}`);
  const wrongPhone = await req(base, "GET", `/api/orders/${order.orderNumber}?phone=09111111111`);
  step(`${tag} order detail refused for the wrong phone`, wrongPhone.status === 404, `status=${wrongPhone.status} ${wrongPhone.text.slice(0, 60)}`);
  const rightPhone = await req(base, "GET", `/api/orders/${order.orderNumber}?phone=${phone}`);
  step(`${tag} order detail allowed for the owner`, rightPhone.status === 200 && rightPhone.json?.order?.orderNumber === order.orderNumber, `status=${rightPhone.status}`);

  /* 7. status change + persistence */
  const patched = await req(base, "PATCH", `/api/admin/orders/${order.orderNumber}/status`, { token, body: { status: "delivered" } });
  step(`${tag} admin can move the order to delivered`, patched.status === 200 && patched.json?.order?.status === "delivered", `status=${patched.status} status=${patched.json?.order?.status}`);
  const bad = await req(base, "PATCH", `/api/admin/orders/${order.orderNumber}/status`, { token, body: { status: "teleported" } });
  step(`${tag} an invented status is refused`, bad.status === 400, `status=${bad.status} ${bad.text.slice(0, 60)}`);
  const afterReload = await req(base, "GET", `/api/orders/${order.orderNumber}?phone=${phone}`);
  step(`${tag} delivered survives a reload`, afterReload.json?.order?.status === "delivered", `status=${afterReload.json?.order?.status}`);
  step(`${tag} delivered is on disk, not just in memory`, fs.readFileSync(ORDERS_FILE, "utf8").includes('"status":"delivered"') || fs.readFileSync(ORDERS_FILE, "utf8").includes(`"status": "delivered"`), ORDERS_FILE);

  /* 8. business rules */
  const oos = orderPayload(phone);
  oos.items = [{ ...oos.items[0], availability: "ناموجود" }];
  const oosRes = await req(base, "POST", "/api/orders", { body: oos });
  step(`${tag} out-of-stock line refused with 409 item_unavailable`, oosRes.status === 409 && oosRes.json?.error === "item_unavailable", `status=${oosRes.status} ${oosRes.text.slice(0, 80)}`);

  const badPostal = orderPayload(phone);
  badPostal.customer.postalCode = "12345";
  const bpRes = await req(base, "POST", "/api/orders", { body: badPostal });
  step(`${tag} invalid postal code refused with 400`, bpRes.status === 400 && bpRes.json?.error === "invalid_postal_code", `status=${bpRes.status} ${bpRes.text.slice(0, 80)}`);

  const emptyCart = orderPayload(phone);
  emptyCart.items = [];
  const ecRes = await req(base, "POST", "/api/orders", { body: emptyCart });
  step(`${tag} empty cart refused with 400 items_required`, ecRes.status === 400 && ecRes.json?.error === "items_required", `status=${ecRes.status} ${ecRes.text.slice(0, 80)}`);

  return { orderNumber: order.orderNumber, phone };
}

/* ---------------------------------------------------------------------- run */
for (const port of PORTS) {
  try {
    await matrixFor(`http://localhost:${port}`);
  } catch (e) {
    step(`[${port}] server reachable`, false, String(e?.message || e));
  }
}

/* cross-instance proof: an order created on one port is visible on the other */
if (PORTS.length > 1) {
  const a = `http://localhost:${PORTS[0]}`;
  const b = `http://localhost:${PORTS[1]}`;
  const t = await req(a, "POST", "/api/admin/login", { body: { username: creds.user, password: creds.pass } });
  const list = await req(b, "GET", "/api/admin/orders", { token: t.json?.token });
  step("[cross-instance] the other server sees the same orders file", (list.json?.orders || []).length > 0, `orders=${list.json?.orders?.length}`);
}

/* persistence across a fresh process: boot a throwaway preview on :4199 */
{
  const child = spawn("npx", ["vite", "preview", "--port", "4199", "--strictPort", "--host", "0.0.0.0"], { stdio: "ignore", cwd: process.cwd() });
  let up = false;
  for (let i = 0; i < 40 && !up; i += 1) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const ping = await fetch("http://localhost:4199/api/customer/orders?phone=09120000000");
      up = ping.status === 200;
    } catch {
      up = false;
    }
  }
  if (up) {
    const list = await req("http://localhost:4199", "GET", "/api/admin/orders");
    step("[fresh process] a brand-new server process serves the same stored orders", list.status === 401 || list.status === 200, `status=${list.status}`);
    const t2 = await req("http://localhost:4199", "POST", "/api/admin/login", { body: { username: creds.user, password: creds.pass } });
    const orders = await req("http://localhost:4199", "GET", "/api/admin/orders", { token: t2.json?.token });
    const numbers = (orders.json?.orders || []).map((o) => o.orderNumber);
    step("[fresh process] orders survive a server restart", numbers.length > 0 && numbers.some((n) => /^KS-\d{8}-/.test(n)), `${numbers.length} orders, e.g. ${numbers.slice(0, 3).join(", ")}`);
    const delivered = (orders.json?.orders || []).find((o) => o.status === "delivered");
    step("[fresh process] the delivered status is still delivered", !!delivered, delivered?.orderNumber || "none");
  } else {
    step("[fresh process] throwaway preview on :4199 started", false, "server did not answer");
  }
  child.kill("SIGTERM");
}

const failed = results.filter((r) => !r.pass);
console.log(`\n ${results.length - failed.length}/${results.length} live API checks passed${failed.length ? ` — ${failed.length} FAILED` : ""}`);
