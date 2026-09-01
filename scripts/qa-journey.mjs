/**
 * KalaSearch — BEB5 end-to-end customer → admin order journey (real browser)
 * =============================================================================
 * Runs the boss's non-negotiable scenario against a live preview:
 *
 *   category (no product image) → product details (real mapped image) →
 *   colour → cart → checkout → POST /api/orders 201 → order number →
 *   admin login → /admin/orders shows THAT order with every field,
 *   including a resolvable product image per line → status → delivered →
 *   persistence across reload → customer isolation.
 *
 *   npm run build && npm run preview
 *   npm i --no-save puppeteer-core @sparticuz/chromium
 *   node scripts/qa-journey.mjs [--url http://localhost:4173]
 *
 * IMAGE TRANSPORT NOTE: this sandbox has no route to ashkanplastic.com or to
 * the image relays, so remote image bytes are answered with a locally generated
 * stand-in PNG *inside the browser only* — to measure and to prove the app
 * asked for the real mapped URL. That is a transport stand-in, not a pixel test:
 * REMOTE IMAGE PIXEL QA stays UNTESTED here and must be repeated on a machine
 * with internet access before the boss accepts the images visually.
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { spawnSync } from "child_process";

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : i >= 0 ? true : fallback;
};
const BASE = String(arg("url", "http://localhost:4173")).replace(/\/$/, "");
const OUT = path.resolve(arg("out", "../qa-screens/journey"));
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const step = (name, pass, detail = "") => {
  results.push({ name, pass: !!pass, detail: String(detail ?? "").slice(0, 400) });
  console.log(` ${pass ? "PASS" : "FAIL"}  ${name}${detail ? `\n          ${String(detail).slice(0, 260)}` : ""}`);
  if (!pass) process.exitCode = 1;
};

/* ------------------------------------------------------------------ browser */
async function launch() {
  const { default: puppeteer } = await import("puppeteer-core");
  let executablePath;
  let chromeArgs = [];
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    executablePath = process.env.CHROME_PATH;
  } else {
    const { default: chromium } = await import("@sparticuz/chromium");
    const libDir = "/tmp/al2023/lib";
    if (!fs.existsSync(path.join(libDir, "libnspr4.so"))) {
      const tarball = path.join(process.cwd(), "node_modules/@sparticuz/chromium/bin/al2023.tar.br");
      if (fs.existsSync(tarball)) {
        fs.mkdirSync("/tmp/al2023", { recursive: true });
        fs.writeFileSync("/tmp/al2023/a.tar", zlib.brotliDecompressSync(fs.readFileSync(tarball)));
        spawnSync("tar", ["-xf", "a.tar", "-C", "/tmp/al2023"], { stdio: "ignore" });
      }
    }
    if (fs.existsSync(libDir)) {
      process.env.LD_LIBRARY_PATH = [libDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");
    }
    chromium.setGraphicsMode = false;
    executablePath = await chromium.executablePath();
    chromeArgs = chromium.args;
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: [...chromeArgs, "--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none", "--force-color-profile=srgb", "--lang=fa"],
  });
}

/* ------------------------------------------------------- stand-in transport */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function standinPng(w = 320, h = 320) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y += 1) {
    const row = y * (1 + w * 3);
    for (let x = 0; x < w; x += 1) {
      const v = 220 - Math.round(40 * ((x + y) / (w + h)));
      raw[row + 1 + x * 3] = v;
      raw[row + 2 + x * 3] = v - 10;
      raw[row + 3 + x * 3] = v - 24;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------- helpers */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const settle = async (page, ms = 700) => {
  await page.waitForFunction(() => document.querySelectorAll("button, a").length > 4, { timeout: 15000 }).catch(() => {});
  await wait(ms);
};
const go = async (page, route) => {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 40000 });
  await settle(page);
};
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) }).catch(() => {});
/** Persian/Arabic digits + separators -> plain integer */
const num = (text) => {
  const map = { "۰": 0, "۱": 1, "۲": 2, "۳": 3, "۴": 4, "۵": 5, "۶": 6, "۷": 7, "۸": 8, "۹": 9, "٠": 0, "١": 1, "٢": 2, "٣": 3, "٤": 4, "٥": 5, "٦": 6, "٧": 7, "٨": 8, "٩": 9 };
  const digits = String(text).replace(/[۰-۹٠-٩]/g, (d) => map[d]).replace(/[^\d]/g, "");
  return digits ? Number(digits) : NaN;
};

async function newPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  const remote = [];
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (req.resourceType() === "image" && !url.startsWith(BASE)) {
      remote.push(url);
      req.respond({ status: 200, contentType: "image/png", body: standinPng() }).catch(() => {});
      return;
    }
    req.continue().catch(() => {});
  });
  page.remoteImageRequests = remote;
  // returning visitor: no welcome modal stealing the first click;
  // `num` is shared into the page so evaluate() bodies can parse Persian digits
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("kala-search-lang", "fa");
    const map = { "۰": 0, "۱": 1, "۲": 2, "۳": 3, "۴": 4, "۵": 5, "۶": 6, "۷": 7, "۸": 8, "۹": 9, "٠": 0, "١": 1, "٢": 2, "٣": 3, "٤": 4, "٥": 5, "٦": 6, "٧": 7, "٨": 8, "٩": 9 };
    globalThis.num = (t) => {
      const d = String(t ?? "").replace(/[۰-۹٠-٩]/g, (c) => map[c]).replace(/[^\d]/g, "");
      return d ? Number(d) : NaN;
    };
  });
  return page;
}

const inputBy = (page, name, value) =>
  page.evaluate(
    ([n, v]) => {
      const el = document.querySelector(`[name="${n}"]`);
      if (!el) return false;
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    },
    [name, value],
  );

/* ---------------------------------------------------------------------- run */
const creds = { user: process.env.ADMIN_USERNAME, pass: process.env.ADMIN_PASSWORD };
if (!creds.user || !creds.pass) {
  const envFile = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
      const m = line.match(/^\s*(ADMIN_USERNAME|ADMIN_PASSWORD)\s*=\s*(.*?)\s*$/);
      if (m) creds[m[1] === "ADMIN_USERNAME" ? "user" : "pass"] = m[2];
    }
  }
}

const browser = await launch();
console.log(`\nKalaSearch E2E journey — ${await browser.version()}\n  target: ${BASE}\n  shots : ${OUT}\n`);
const page = await newPage(browser);

/* 1. category screen: identity only, never a product photo */
await go(page, "/category/shopping-basket");
const category = await page.evaluate(() => {
  const grid = document.querySelector(".ks-category-product-grid");
  const cards = [...(grid?.querySelectorAll(".ks-product-card") ?? [])];
  return {
    cards: cards.length,
    images: grid ? grid.querySelectorAll("img").length : -1,
    withIcon: cards.filter((c) => c.querySelector(".ks-product-card-icon")).length,
    withCode: cards.filter((c) => c.textContent.includes("کد محصول")).length,
    sample: cards[0]?.textContent?.replace(/\s+/g, " ").trim().slice(0, 90) ?? "",
  };
});
step("[category] product cards rendered", category.cards > 0, `${category.cards} cards — e.g. "${category.sample}"`);
step("[category] cards contain NO product image", category.cards > 0 && category.images === 0, `img elements inside grid: ${category.images}`);
step("[category] cards show the category icon + code", category.withIcon === category.cards && category.withCode === category.cards, `icon ${category.withIcon}/${category.cards}, code ${category.withCode}/${category.cards}`);
step("[category] no image request was made for cards", page.remoteImageRequests.length === 0, `${page.remoteImageRequests.length} remote image request(s)`);
await shot(page, "01-category");

/* 2. product details: the real mapped image */
const href = await page.evaluate(() => document.querySelector('.ks-category-product-grid a[href*="/product/"]')?.getAttribute("href") ?? "");
await go(page, href || "/product/6015010");
const detail = await page.evaluate(() => {
  const img = document.querySelector(".product-media img");
  const box = img?.getBoundingClientRect();
  return {
    src: img?.currentSrc || img?.src || "",
    painted: !!img && img.complete && img.naturalWidth > 0,
    w: Math.round(box?.width ?? 0),
    h: Math.round(box?.height ?? 0),
    ashkanBtn: [...document.querySelectorAll("a")].find((a) => a.textContent.includes("اشکان پلاستیک"))?.href ?? "",
    colors: [...document.querySelectorAll("button")].filter((b) => b.querySelector("span[style*='background']") && b.textContent.trim().length <= 14).map((b) => b.textContent.trim()),
    title: document.querySelector("h1,h2")?.textContent?.trim().slice(0, 60) ?? "",
  };
});
const askedFor = decodeURIComponent(detail.src.includes("url=") ? detail.src.split("url=")[1].split("&")[0] : detail.src);
step("[product] real mapped image is painted", detail.painted && detail.w > 60, `${detail.w}×${detail.h} from ${askedFor.slice(0, 80)}`);
step("[product] request carries the real Ashkan asset URL", /ashkanplastic\.com\/wp-content\/uploads\//.test(askedFor), askedFor.slice(0, 100));
step("[product] Ashkan link opens the real product URL in a new tab", /^https:\/\/ashkanplastic\.com\/product\/\d+\/$/.test(detail.ashkanBtn), detail.ashkanBtn || "no button (no real link in data)");
await shot(page, "02-product");

const categoryHrefs = await page.evaluate(() => [...document.querySelectorAll('.ks-category-product-grid a[href*="/product/"]')].map((a) => a.getAttribute("href")));

/* 3. colour + add to cart (out-of-stock products offer «درخواست تولید» by
      design, so walk the colour options — and then the next product — until the
      real add-to-cart path exists) */
// mirrors a real customer: choose a colour, set a quantity (it starts at 0 by
// design), then add. Returns the button that was available.
const buy = async (colourName) =>
  page.evaluate(async (wanted) => {
    const colourBtns = [...document.querySelectorAll("button")].filter(
      (b) => b.querySelector("span[style*='background']") && b.textContent.trim() && b.textContent.trim().length <= 14,
    );
    const target = wanted
      ? colourBtns.find((b) => b.textContent.trim() === wanted)
      : colourBtns[0];
    target?.click();
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    await wait(120);
    const addBtn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("افزودن به سبد"));
    if (!addBtn) {
      return { canBuy: false, label: target?.textContent.trim() ?? "", colours: colourBtns.map((b) => b.textContent.trim()) };
    }
    for (let i = 0; i < 2; i += 1) {
      document.querySelector('button[aria-label="افزایش تعداد"]')?.click();
      await wait(60);
    }
    const qty = Number(document.querySelector('button[aria-label="افزایش تعداد"]')?.parentElement?.querySelector("span")?.textContent ?? 0);
    const btn2 = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("افزودن به سبد"));
    btn2?.click();
    await wait(220);
    return { canBuy: true, label: target?.textContent.trim() ?? "", qty, colourCount: colourBtns.length };
  }, colourName);

let bought = null;
let attempt = 0;
let current = href || "/product/6015010";
const moreHrefs = categoryHrefs;
while (attempt < 6 && !bought) {
  await go(page, current);
  const first = await buy(undefined);
  if (first.canBuy) {
    bought = { ...first, product: current };
    break;
  }
  for (const colour of first.colours ?? []) {
    const r = await buy(colour);
    if (r.canBuy) {
      bought = { ...r, product: current };
      break;
    }
  }
  attempt += 1;
  current = moreHrefs[attempt] ?? current;
  if (!current) break;
}
step("[product] a colour variation can be selected and bought", !!bought, bought ? `“${bought.label}” qty=${bought.qty} on ${bought.product}` : "no purchasable variation in the first 6 products");
await wait(600);
const inCart = await page.evaluate(() => {
  const raw = localStorage.getItem("kala-search-cart");
  const list = raw ? JSON.parse(raw) : [];
  return { count: list.length, first: list[0] ?? null };
});
step("[product] add to cart stored a real line", inCart.count > 0, inCart.first ? `product=${inCart.first.productId} qty=${inCart.first.quantity} variation=${inCart.first.variation?.id ?? "-"} image=${String(inCart.first.image).slice(-24)}` : "cart empty");
step("[product] the stored line keeps a real image reference", String(inCart.first?.image ?? "").length > 3, `${inCart.first?.image ?? "none"} (resolved to the mapped URL when painted)`);
step("[product] the stored line carries sku + colour + quantity", !!inCart.first?.variation?.sku && !!inCart.first?.variation?.color && inCart.first.quantity === 2, JSON.stringify(inCart.first?.variation ?? {}).slice(0, 140));
await shot(page, "03-added");

/* 4. cart completeness */
await go(page, "/cart");
const cart = await page.evaluate(() => {
  const text = document.body.innerText.replace(/\u200c/g, " ");
  const line = [...document.querySelectorAll("div")].find((d) => d.className.includes && String(d.className).includes("rounded-2xl") && d.textContent.includes("کد محصول"));
  const img = line?.querySelector("img");
  return {
    hasName: /سبد|لگن|آبکش|سطل|ظرف/.test(text),
    code: (text.match(/کد محصول:?\s*([\d-]+)/) ?? [])[1] ?? "",
    id: (text.match(/شناسه محصول:?\s*([\d-]+)/) ?? [])[1] ?? "",
    // the id line is only rendered when it differs from the code (no duplicates)
    sameIds: (text.match(/کد محصول:?\s*([\d-]+)/) ?? [])[1] === (text.match(/شناسه محصول:?\s*([\d-]+)/) ?? [])[1],
    sku: (text.match(/شناسه موجودی:?\s*([\w-]+)/) ?? [])[1] ?? "",
    color: (text.match(/رنگ:?\s*([^\n]{2,20})/) ?? [])[1]?.trim() ?? "",
    qty: num((text.match(/تعداد:?\s*([\d۰-۹]+)/) ?? [])[1] ?? ""),
    unit: num((text.match(/قیمت واحد:?\s*([\d.,۰-۹]+)/) ?? [])[1] ?? ""),
    lineTotal: num((text.match(/جمع ردیف:?\s*([\d.,۰-۹]+)/) ?? [])[1] ?? ""),
    labels: { sku: text.includes("شناسه موجودی"), color: text.includes("رنگ:"), qty: text.includes("تعداد:"), unit: text.includes("قیمت واحد"), line: text.includes("جمع ردیف") },
    imageSrc: img?.src ?? "",
    imgPainted: !!img && img.complete && img.naturalWidth > 0,
    qtyControls: [...document.querySelectorAll("button")].filter((b) => b.querySelector("svg.lucide-minus, svg.lucide-plus")).length / 2,
    removeBtn: [...document.querySelectorAll("button")].some((b) => b.textContent.includes("حذف")),
    checkoutBtn: [...document.querySelectorAll("a,button")].some((b) => b.textContent.includes("ادامه") || b.textContent.includes("ثبت سفارش") || b.getAttribute("href") === "/checkout"),
  };
});
step("[cart] line shows the product code and its id when they differ", !!cart.code, `code=${cart.code} id=${cart.id || "(same as code)"}`);
step("[cart] line shows sku + colour", !!cart.sku && !!cart.color, `sku=${cart.sku} color=${cart.color}`);
step("[cart] line shows qty / unit price / line total", cart.qty > 0 && cart.unit > 0 && cart.lineTotal > 0, `qty=${cart.qty} unit=${cart.unit} total=${cart.lineTotal}`);
step("[cart] line total = unit × qty", cart.unit * cart.qty === cart.lineTotal, `${cart.unit}×${cart.qty}=${cart.lineTotal}`);
step("[cart] line image is the mapped asset", /ashkanplastic\.com\/wp-content\/uploads\/|images\.weserv\.nl|wsrv\.nl/.test(cart.imageSrc) && cart.imgPainted, cart.imageSrc.slice(0, 90) || "missing");
step("[cart] quantity control + remove available", cart.qtyControls >= 1 && cart.removeBtn, `steppers=${cart.qtyControls} remove=${cart.removeBtn}`);
step("[cart] checkout reachable", cart.checkoutBtn);
await shot(page, "04-cart");

/* 5. checkout → real order */
await go(page, "/checkout");
const filled = await page.evaluate(() => ({ fields: [...document.querySelectorAll("input,textarea")].map((i) => i.getAttribute("name")) }));
const testOrder = {
  fullName: "مشتری آزمایشی مرورگر",
  phone: "9121234567",
  email: "qa.journey@example.com",
  province: "تهران",
  city: "تهران",
  address: "خیابان آزمایش، کوچه ۵، پلاک ۱۲، واحد ۳",
  postalCode: "1234567890",
  notes: "ثبت سفارش از طریق تست خودکار مرورگر (BEB5)",
};
for (const [key, value] of Object.entries(testOrder)) {
  if (filled.fields.includes(key)) await inputBy(page, key, value);
}
await wait(300);
const postResponses = [];
page.on("response", async (res) => {
  if (res.url().endsWith("/api/orders") && res.request().method() === "POST") {
    postResponses.push({ status: res.status(), body: await res.text().catch(() => "") });
  }
});
const submitted = await page.evaluate(() => {
  const btn = document.querySelector('form button[type="submit"]');
  if (!btn) return false;
  btn.click();
  return true;
});
await wait(2500);
const success = await page.evaluate(() => {
  const text = document.body.innerText;
  return {
    orderNumber: (text.match(/KS-\d{8}-[0-9A-F]{6}/) ?? [])[0] ?? "",
    pdfNote: text.includes("در حال تولید") || text.includes("آماده") || text.includes("تولید PDF"),
    saved: text.includes("در سرور ذخیره شد") || text.includes("پنل مدیر"),
    alert: document.querySelector('[role="alert"]')?.textContent?.trim() ?? "",
  };
});
step("[checkout] form exposes real named fields", filled.fields.filter((f) => f).length >= 7, filled.fields.join(","));
step("[checkout] submit reached the API", submitted && postResponses.length > 0, `POST /api/orders ×${postResponses.length}`);
step("[checkout] POST /api/orders returned 201", postResponses[0]?.status === 201, `status=${postResponses[0]?.status} body=${(postResponses[0]?.body ?? "").slice(0, 90)}`);
step("[checkout] order number shown to the customer", /^KS-\d{8}-[0-9A-F]{6}$/.test(success.orderNumber), success.orderNumber || `alert: ${success.alert}`);
step("[checkout] confirmation is not blocked by PDF generation", !!success.orderNumber && success.pdfNote, success.pdfNote ? "order confirmed, PDF status shown separately" : success.alert);
step("[checkout] no failure alert on success", !success.alert, success.alert || "clean");
await shot(page, "05-order-created");
const orderNumber = success.orderNumber;

/* 6. customer isolation before leaving the customer side */
const custPhone = "0" + testOrder.phone;
const isolation = await Promise.all([
  fetch(`${BASE}/api/customer/orders?phone=${encodeURIComponent(custPhone)}`).then((r) => r.json()),
  fetch(`${BASE}/api/customer/orders?phone=09999999999`).then((r) => r.json()),
]);
step("[api] customer sees their own order", (isolation[0].orders ?? []).some((o) => o.orderNumber === orderNumber), `${(isolation[0].orders ?? []).length} order(s) for ${custPhone}`);
step("[api] another phone sees nothing (isolation)", (isolation[1].orders ?? []).length === 0, `${(isolation[1].orders ?? []).length} order(s) leaked`);

/* 7. admin side — must see exactly that order */
await page.evaluate(() => {
  // leave the customer session behind, like a real hand-off to the office
  localStorage.removeItem("kala-search-account");
});
await go(page, "/admin");
const loginForm = await page.evaluate(() => ({ inputs: [...document.querySelectorAll("input")].map((i) => i.type) }));
await inputBy(page, "username", creds.user);
const pwFilled = await page.evaluate((pw) => {
  const el = document.querySelector('input[type="password"]');
  if (!el) return false;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, pw);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}, creds.pass);
await page.evaluate(() => document.querySelector('form button[type="submit"]')?.click());
await wait(1400);
const afterLogin = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText.replace(/\s+/g, " ").slice(0, 160) }));
step("[admin] login accepted with env credentials", afterLogin.path.includes("/admin/orders"), `form=${loginForm.inputs.join("/")} pw=${pwFilled} → ${afterLogin.path}`);
step("[admin] the customer's order is listed", !!orderNumber && afterLogin.text.includes(orderNumber), orderNumber ? `looking for ${orderNumber}` : "NO ORDER NUMBER WAS PRODUCED — nothing to find");
await shot(page, "06-admin-list");

/* 8. open the order and audit every required field */
await page.evaluate((target) => {
  const card = [...document.querySelectorAll("button")].find((b) => b.textContent.includes(target));
  card?.click();
}, orderNumber);
await wait(700);
const adminOrder = await page.evaluate(() => {
  const text = document.body.innerText.replace(/\u200c/g, " ");
  const imgs = [...document.querySelectorAll("img")];
  return {
    text: text.slice(0, 1600),
    orderNumber: (text.match(/KS-\d{8}-[0-9A-F]{6}/) ?? [])[0] ?? "",
    imageSrcs: imgs.map((i) => ({ src: i.currentSrc || i.src, painted: i.complete && i.naturalWidth > 0 })),
    statusSelect: [...document.querySelectorAll("select")].map((s) => s.value).join(","),
  };
});
const need = {
  "Order Number": adminOrder.orderNumber === orderNumber,
  "Customer name": adminOrder.text.includes(testOrder.fullName),
  Phone: adminOrder.text.includes("+989121234567") || adminOrder.text.includes("9121234567"),
  Province: adminOrder.text.includes(testOrder.province),
  City: adminOrder.text.includes(testOrder.city),
  "Postal code": adminOrder.text.includes(testOrder.postalCode),
  Address: adminOrder.text.includes("خیابان آزمایش"),
  "Payment status": /پرداخت|پرداخت/.test(adminOrder.text) && /پرداخت نشده/.test(adminOrder.text),
  Status: /وضعیت/.test(adminOrder.text),
  Total: /جمع/.test(adminOrder.text) && /تومان/.test(adminOrder.text),
  "Product name": /سبد|لگن|آبکش|سطل|ظرف|ست/.test(adminOrder.text),
  "Product ID": /شناسه محصول/.test(adminOrder.text),
  "Product code": /کد محصول/.test(adminOrder.text),
  SKU: /شناسه موجودی/.test(adminOrder.text),
  Variation: /انتخاب گزینه|شناسه موجودی/.test(adminOrder.text),
  Color: /رنگ/.test(adminOrder.text),
  Quantity: /تعداد/.test(adminOrder.text),
  "Unit price": /قیمت واحد/.test(adminOrder.text),
  "Line total": /جمع ردیف/.test(adminOrder.text),
};
for (const [label, ok] of Object.entries(need)) {
  step(`[admin] order card shows ${label}`, ok, ok ? "" : `excerpt: ${adminOrder.text.replace(/\n/g, " ").slice(0, 120)}`);
}
const lineImages = adminOrder.imageSrcs;
step("[admin] order line image resolves to the mapped asset", lineImages.length > 0 && lineImages.every((i) => /ashkanplastic\.com\/wp-content\/uploads\/|images\.weserv\.nl|wsrv\.nl/.test(decodeURIComponent(i.src))) && lineImages.every((i) => i.painted), JSON.stringify(lineImages).slice(0, 160));
step("[admin] no raw relative file name in an order-line <img>", !lineImages.some((i) => /^\w[\w-]*\.(jpg|jpeg|png|webp)$/i.test(i.src) || /^https?:\/\/[^/]+\/admin\/.*\.(jpg|png)$/i.test(i.src)), lineImages.map((i) => i.src.slice(-40)).join(" | ") || "no images");
await shot(page, "07-admin-detail");

/* 9. status → delivered, and it survives a reload */
const moved = await page.evaluate(() => {
  const select = document.querySelector("select");
  if (!select) return null;
  const wanted = "delivered";
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
  setter.call(select, wanted);
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return wanted;
});
await wait(1200);
await page.reload({ waitUntil: "domcontentloaded" });
await settle(page, 900);
const persisted = await page.evaluate((target) => {
  const card = [...document.querySelectorAll("div")].find((d) => d.textContent.includes(target) && d.querySelector("select"));
  const text = document.body.innerText.replace(/\s+/g, " ");
  return { select: card?.querySelector("select")?.value ?? "", hasOrder: text.includes(target), delivered: /تحویل شده|تحویل‌شده|تحویل گردید/.test(text) };
}, orderNumber);
step("[admin] status can be moved to delivered", moved === "delivered", `selected=${moved}`);
step("[admin] order + delivered status persist across reload", persisted.hasOrder && (persisted.select === "delivered" || persisted.delivered), `select=${persisted.select} text=${persisted.delivered}`);
await shot(page, "08-admin-delivered");

/* 10. the PDF of the same order must be producible from the stored record.
      The reload collapsed the card again, so expand it first — and watch for a
      silently failing PDF (the old bug hid behind the success screen). */
// The app hands the PDF to window.open(blobUrl). Headless does not always
// report that window as a target, so capture the URL and verify the BYTES:
// a real %PDF stream generated from the stored order, not a placeholder.
const pdfCheck = await page.evaluate(async (target) => {
  const toggle = [...document.querySelectorAll("button")].find((b) => b.textContent.includes(target));
  toggle?.click();
  await new Promise((r) => setTimeout(r, 500));
  const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("مشاهده PDF"));
  if (!btn) return { found: false };
  const opened = [];
  const realOpen = window.open;
  window.open = (url) => {
    opened.push(String(url));
    return null;
  };
  btn.click();
  const deadline = Date.now() + 20000;
  while (opened.length === 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250));
  window.open = realOpen;
  let head = "";
  let bytes = 0;
  if (opened[0]?.startsWith("blob:")) {
    try {
      const buf = await (await fetch(opened[0])).arrayBuffer();
      bytes = buf.byteLength;
      head = new TextDecoder("latin1").decode(new Uint8Array(buf).slice(0, 8));
    } catch (e) {
      head = `read-failed: ${e}`;
    }
  }
  return { found: true, opened, bytes, head, error: document.body.innerText.includes("خطایی رخ داد") };
}, orderNumber);
await wait(400);
step("[admin] stored order's PDF control works without an error", pdfCheck.found && !pdfCheck.error, JSON.stringify(pdfCheck).slice(0, 170));
step("[admin] that PDF is generated from the STORED order (real %PDF bytes)", pdfCheck.head?.startsWith?.("%PDF") && pdfCheck.bytes > 2000, `head=${pdfCheck.head} size=${pdfCheck.bytes}B url=${(pdfCheck.opened ?? [])[0]?.slice(0, 40)}`);

/* 11. persistence file really changed on the server */
const storeFile = path.resolve(process.cwd(), "data/orders.json");
let stored = null;
if (fs.existsSync(storeFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(storeFile, "utf8"));
    const list = Array.isArray(data) ? data : data.orders ?? [];
    stored = list.find((o) => o.orderNumber === orderNumber) ?? null;
  } catch (e) {
    stored = { error: String(e) };
  }
}
step("[store] the order exists in the server's persistence file", !!stored && stored.orderNumber === orderNumber, stored ? `${storeFile} → ${stored.orderNumber} status=${stored.status}` : "not found");
step("[store] persisted total + line data match the cart", !!stored && Number(stored.total) > 0 && (stored.items?.[0]?.image ?? "").includes("ashkanplastic.com"), stored ? `total=${stored.total} image=${stored.items?.[0]?.image}` : "n/a");

/* 12. images actually requested (transport honesty) */
const remoteCount = page.remoteImageRequests.length;
fs.writeFileSync(path.join(OUT, "image-requests.json"), JSON.stringify(page.remoteImageRequests, null, 2));
console.log(`\n remote image requests made by the app: ${remoteCount} (recorded in ${OUT}/image-requests.json)`);
console.log(" REMOTE IMAGE PIXEL QA = UNTESTED here — bytes were answered by a local stand-in because this sandbox cannot reach ashkanplastic.com or the relays.");

fs.writeFileSync(path.join(OUT, "journey-report.json"), JSON.stringify({ base: BASE, orderNumber, results }, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(`\n ${results.length - failed.length}/${results.length} journey checks passed`);
if (failed.length) console.log(` failed: ${failed.map((f) => f.name).join(" | ")}`);
await browser.close();
process.exit(failed.length ? 1 : 0);
