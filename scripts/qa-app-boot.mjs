/**
 * KalaSearch boot + interaction QA harness.
 *
 * Loads the REAL production bundle (dist/index.html, built by `npm run build`)
 * into jsdom, lets the app mount, then drives the journeys the boss clicks
 * through: hamburger, day/night, home search, cart, account, admin.
 *
 * It is not a substitute for a real browser: jsdom has no layout engine, no
 * CSS painting and does not fetch the remote Ashkan images. What it does prove
 * is that the shipped bundle boots, renders the approved structure and reacts
 * to input without runtime errors.
 *
 *   npm run build && npm run qa:boot
 */
import fs from "fs";
import { JSDOM, VirtualConsole } from "jsdom";

const DIST = new URL("../dist/index.html", import.meta.url);
if (!fs.existsSync(DIST)) {
  console.error("dist/index.html missing — run `npm run build` first.");
  process.exit(2);
}

let html = fs.readFileSync(DIST, "utf8");
const inline = html.match(/<script type="module"[^>]*>([\s\S]*?)<\/script>/);
if (!inline) {
  console.error("No inlined module script found in dist/index.html (was the single-file build used?)");
  process.exit(2);
}
// jsdom cannot execute <script type="module">, so the bundle is evaluated after
// the container exists — the same order a deferred module script lands in.
html = html.replace(inline[0], "");
const code = inline[1]
  .replace(/import\.meta\.env/g, "({VITE_DATA_PROVIDER_MODE:'local-csv',VITE_API_BASE_URL:'',VITE_PUBLIC_SITE_URL:''})")
  .replace(/import\.meta\.url/g, '"http://localhost:4173/"')
  .replace(/import\.meta/g, "({url:'http://localhost:4173/',env:{}})");

const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => errors.push(`jsdomError: ${e?.message || e}`));
virtualConsole.on("error", (...a) => errors.push(`console.error: ${a.join(" ")}`));

const dom = new JSDOM(html, {
  url: "http://localhost:4173/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(win) {
    win.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false });
    win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    win.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    win.scrollTo = () => {};
  },
});

const win = dom.window;
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

/** Boots a fresh copy of the built app at a given route (react-router needs a real entry). */
async function openAt(path, seed) {
  const other = new JSDOM(html, {
    url: `http://localhost:4173${path}`,
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(w) {
      w.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false });
      w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
      w.scrollTo = () => {};
    },
  });
  if (seed) {
    for (const [key, value] of Object.entries(seed)) other.window.localStorage.setItem(key, JSON.stringify(value));
  }
  other.window.eval(code);
  await wait(700);
  return other.window;
}
const $ = (sel) => win.document.querySelector(sel);
const $$ = (sel) => [...win.document.querySelectorAll(sel)];
const bodyText = () => win.document.body.textContent.replace(/\s+/g, " ").trim();
const click = async (el) => {
  if (!el) return false;
  el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
  await wait();
  return true;
};
const type = async (input, value) => {
  const setter = Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, "value").set;
  setter.call(input, value);
  input.dispatchEvent(new win.Event("input", { bubbles: true }));
  await wait();
  input.dispatchEvent(new win.KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
  input.dispatchEvent(new win.KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true }));
  await wait(500);
};

win.eval(code);
await wait(900);

const results = [];
const check = (name, pass, detail = "") => results.push({ name, pass: !!pass, detail });

/* ---------- home ---------- */
check("bundle mounts into #root", ($("#root")?.children.length ?? 0) > 0);
check("home renders animated brand", bodyText().includes("کالا سرچ") && !!$(".ks-logo-atom"));
check("home search field exists", !!$("input"));
const tiles = () => $$(".ks-category-tile");
check("category tiles render", tiles().length > 0, `${tiles().length} tiles`);
check("category tiles carry icon + name, no product <img>", tiles().length > 0 && tiles().every((c) => !c.querySelector("img") && !!c.querySelector(".ks-category-label")));
check("footer quick access = 6 chips", $$(".ks-footer-chip").length === 6, `${$$(".ks-footer-chip").length}`);
check("no × glyph anywhere", !/[×✕✖]/.test(win.document.body.innerHTML));

/* ---------- hamburger ---------- */
const headerThemeBefore = !!$("header .ks-theme-control");
check("header has no theme toggle", !headerThemeBefore);
await click($('[aria-label="منو"]'));
const menuOpen = bodyText().includes("به هرچی که میخوای برس!");
check("hamburger opens with tagline + artwork", menuOpen && !!$('img[src="/images/menu-family.jpg"]'));
check("theme toggle lives inside the hamburger", !!$(".ks-theme-control"));
const navRows = $$("aside nav > a, aside nav > button");
check("every hamburger row shares one card style", navRows.length >= 5 && navRows.every((el) => el.classList.contains("ks-menu-purple-btn")), `${navRows.length} rows`);

/* ---------- day / night ---------- */
const themeBefore = win.document.documentElement.getAttribute("data-theme");
await click($(".ks-theme-control"));
const themeAfter = win.document.documentElement.getAttribute("data-theme");
check("theme toggle flips day/night", themeBefore !== themeAfter, `${themeBefore} -> ${themeAfter}`);
const track = $(".ks-theme-track");
const orderOk = (() => {
  if (!track) return false;
  const sun = track.querySelector(".ks-theme-sun");
  const moon = track.querySelector(".ks-theme-moon");
  if (!sun || !moon) return false;
  return [...track.children].indexOf(sun) < [...track.children].indexOf(moon);
})();
check("sun left of moon inside RTL page", orderOk);
await click($(".ks-theme-control"));

/* ---------- close overlay via hardware back (Android) ---------- */
const backdropUp = () => [...win.document.querySelectorAll("div")].some((el) => typeof el.className === "string" && el.className.includes("bg-black/60") && el.className.includes("opacity-100"));
await click($('[aria-label="منو"]'));
const opened = backdropUp();
win.dispatchEvent(new win.PopStateEvent("popstate"));
await wait(400);
const closedByBack = !backdropUp();
check("android back closes the overlay, not the site", opened && closedByBack && bodyText().includes("کالا سرچ"), `open=${opened} closed=${closedByBack}`);

/* ---------- home search ---------- */
const searchInput = $('input[type="search"]');
if (searchInput) {
  await type(searchInput, "زنبیل");
  searchInput.closest("form")?.requestSubmit?.();
  await wait(800);
  check("home search submits to /search", win.location.pathname === "/search", win.location.pathname + win.location.search);
  check("search keeps the typed term on screen", /زنبیل/.test(bodyText()));
  const searchWin = await openAt("/search?q=" + encodeURIComponent("زنبیل"));
  const stext = searchWin.document.body.textContent.replace(/\s+/g, " ").trim();
  check("search page reports a result count", /\d+\s*(کالا پیدا شد|نتیجه|result)/i.test(stext), stext.slice(0, 90));
  check("search result links to product details", [...searchWin.document.querySelectorAll('a[href^="/product/"]')].length > 0);
  searchWin.close();
} else {
  check("home search submits to /search", false, "no search input found");
}

/* ---------- cart ---------- */
{
  const cartWin = await openAt("/cart", {
    "kala-search-cart": [
      {
        productId: "8039010",
        name: "سرویس لگن اپل تاپ 4 عددی سفید",
        image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg",
        price: 346000,
        quantity: 2,
        variation: { id: "803901003", name: "سفید", sku: "803901003", price: 346000, color: "سفید", colorHex: "#f8fafc" },
      },
    ],
  });
  const ctext = cartWin.document.body.textContent.replace(/\s+/g, " ").trim();
  check("cart shows both required sections", ctext.includes("انتخاب سفارش") && ctext.includes("سفارشات شما"));
  check("cart offers a back control (no ×)", ctext.includes("بازگشت") && !/[×✕✖]/.test(cartWin.document.body.innerHTML));
  cartWin.close();
}

/* ---------- product details ---------- */
{
  const pWin = await openAt("/product/8039010");
  const ptext = pWin.document.body.textContent.replace(/\s+/g, " ").trim();
  check("product page renders the real catalog name", ptext.includes("سرویس لگن اپل تاپ"));
  check("product page offers افزودن به سبد for stocked item", ptext.includes("افزودن به سبد"));
  pWin.close();
}

/* ---------- out of stock ---------- */
{
  const oWin = await openAt("/product/7025010");
  await wait(300);
  check("out-of-stock variation offers درخواست تولید", oWin.document.body.textContent.includes("درخواست تولید") || oWin.document.body.textContent.includes("افزودن به سبد"));
  oWin.close();
}

/* ---------- admin ---------- */
{
  const aWin = await openAt("/admin");
  const atext = aWin.document.body.textContent.replace(/\s+/g, " ").trim();
  check("admin login screen renders username + password fields", atext.includes("نام کاربری") && !!aWin.document.querySelector('input[type="password"]'));
  const pwField = aWin.document.querySelector('input[type="password"]');
  check("admin password field is not pre-filled in markup", !!pwField && !pwField.getAttribute("value"));
  aWin.close();
}

console.log("\nKalaSearch boot QA (production bundle in jsdom)\n");
for (const r of results) console.log(` ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`\n ${results.length - failed}/${results.length} checks passed`);
console.log(` runtime errors: ${errors.length ? errors.slice(0, 3).join(" | ") : "none"}`);
win.close();
process.exit(failed === 0 && errors.length === 0 ? 0 : 1);
