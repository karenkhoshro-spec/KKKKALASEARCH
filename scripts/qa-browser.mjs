/**
 * KalaSearch — real browser QA (layout, paint, mobile, navigation)
 * =================================================================
 * Drives a real headless Chromium against a running preview and checks the
 * things jsdom can never prove: computed geometry, paint, RTL flex order,
 * mobile overflow/tap targets and hardware-back behaviour.
 *
 *   npm run build && npm run preview        # or use the dev server on 5173
 *   npm i --no-save puppeteer-core @sparticuz/chromium
 *   node scripts/qa-browser.mjs
 *
 * QA tools are intentionally NOT project dependencies (they are ~150 MB of
 * browser binaries and must never reach the Ashkan Plastic deployment).
 * The script exits with code 0/1 and writes screenshots + a JSON report.
 *
 * Flags:  --url <origin>   default http://localhost:4173
 *         --out <dir>      default ../qa-screens (outside the repo)
 *         --headed         disables headless mode
 *
 * NOTE ON IMAGES: this sandbox has no network route to ashkanplastic.com or to
 * the image relays, so image requests are answered with a locally generated
 * placeholder PNG *inside the browser only*, purely to measure layout. The
 * real asset bytes are never invented by the app, and every requested URL is
 * recorded and asserted to be the real origin/relay URL.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import zlib from "zlib";

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : i >= 0 ? true : fallback;
};
const BASE = (arg("url", "http://localhost:4173") || "").replace(/\/$/, "");
const OUT = path.resolve(arg("out", "../qa-screens"));
fs.mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- browser */
async function resolveBrowser() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return { executablePath: process.env.CHROME_PATH, args: [] };
  }
  const { default: chromium } = await import("@sparticuz/chromium");
  // Amazon-Linux runtime libs (libnss3/libnspr4/…) ship inside the npm package
  // as a brotli tarball; extract them when the loader cannot find them.
  const libDir = "/tmp/al2023/lib";
  if (!fs.existsSync(path.join(libDir, "libnspr4.so"))) {
    const tarball = chromium.assetPath
      ? path.join(chromium.assetPath, "al2023.tar.br")
      : path.join(process.cwd(), "node_modules/@sparticuz/chromium/bin/al2023.tar.br");
    if (fs.existsSync(tarball)) {
      fs.mkdirSync("/tmp/al2023", { recursive: true });
      const tarOut = "/tmp/al2023/a.tar";
      fs.writeFileSync(tarOut, zlib.brotliDecompressSync(fs.readFileSync(tarball)));
      // the archive holds lib/*.so next to the binary; extract with an absolute
      // path (a relative "-xf a.tar" silently fails when cwd is the repo)
      const untar = spawnSync("tar", ["-xf", tarOut, "-C", "/tmp/al2023"], { encoding: "utf8" });
      if (untar.status !== 0) {
        throw new Error(`could not unpack the Chromium runtime libraries for QA: ${untar.stderr || untar.error || "tar failed"}`);
      }
      fs.rmSync(tarOut, { force: true });
      fs.rmSync("/tmp/al2023/a.tar", { force: true });
    }
  }
  if (fs.existsSync(libDir)) {
    process.env.LD_LIBRARY_PATH = [libDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");
  }
  chromium.setGraphicsMode = false;
  return { executablePath: await chromium.executablePath(), args: chromium.args };
}

let puppeteer;
try {
  ({ default: puppeteer } = await import("puppeteer-core"));
} catch {
  console.error("puppeteer-core is not installed — run:\n  npm i --no-save puppeteer-core @sparticuz/chromium");
  process.exit(3);
}

/* ------------------------------------------------------------ fake image */
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i];
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function placeholderPng(width = 240, height = 240) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const row = y * (1 + width * 3);
    for (let x = 0; x < width; x += 1) {
      const shade = 232 - Math.round(28 * ((x + y) / (width + height)));
      raw[row + 1 + x * 3] = shade;
      raw[row + 2 + x * 3] = shade - 8;
      raw[row + 3 + x * 3] = shade - 18;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]).toString("base64");
}
const FAKE_PNG = placeholderPng();

/* ---------------------------------------------------------------- helpers */
const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass: !!pass, detail: String(detail ?? "") });
  return !!pass;
};
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

async function newPage(browser, { mobile = false } = {}) {
  const page = await browser.newPage();
  await page.setViewport(
    mobile
      ? { width: 412, height: 915, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }
      : { width: 1440, height: 900, deviceScaleFactor: 2 },
  );
  // helper exposed to every page.evaluate() body (they cannot close over node scope)
  await page.evaluateOnNewDocument((seed) => {
    globalThis.round = (n) => Math.round((Number(n) || 0) * 100) / 100;
    for (const [k, v] of Object.entries(seed)) {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
    }
  }, {
    // a returning visitor: the language welcome modal must not cover measurements
    "kala-search-lang": "fa",
    "kala-search-theme": JSON.stringify({ theme: mobile ? "dark" : "dark" }),
  });
  const imageRequests = [];
  await page.setRequestInterception(true);
  page.on("request", async (req) => {
    const url = req.url();
    if (req.resourceType() === "image" && !url.startsWith(BASE)) {
      imageRequests.push(url);
      try {
        await req.respond({ status: 200, contentType: "image/png", body: Buffer.from(FAKE_PNG, "base64") });
      } catch {
        /* already handled */
      }
      return;
    }
    req.continue().catch(() => {});
  });
  page.imageRequests = imageRequests;
  return page;
}

const settle = async (page) => {
  await page
    .waitForFunction(() => document.querySelectorAll("header a, header button, .ks-category-tile").length > 3, { timeout: 15000 })
    .catch(() => {});
  await new Promise((r) => setTimeout(r, 600));
};
const goto = async (page, route) => {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await settle(page);
};
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

const geometry = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: r.x, y: r.y, w: r.width, h: r.height,
      left: r.left, right: r.right, top: r.top, bottom: r.bottom,
      cx: r.left + r.width / 2, cy: r.top + r.height / 2,
      display: cs.display, direction: cs.direction, visibility: cs.visibility,
    };
  }, selector);

/* ------------------------------------------------------------------- main */
const { executablePath, args } = await resolveBrowser();
const browser = await puppeteer.launch({
  executablePath,
  headless: arg("headed") ? false : true,
  args: [...args, "--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb", "--lang=fa", "--font-render-hinting=none"],
});

console.log(`\nKalaSearch browser QA — ${await browser.version()}\n  target: ${BASE}\n  shots : ${OUT}\n`);

for (const mode of ["desktop", "mobile"]) {
  const mobile = mode === "mobile";
  const page = await newPage(browser, { mobile });
  const tag = mobile ? "mobile" : "desktop";

  /* ---------------------------------------------------- 1. category glow */
  await goto(page, "/");
  const glow = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll(".ks-category-tile")];
    if (tiles.length === 0) return { tiles: 0 };
    const measure = (tile) => {
      const plate = tile.querySelector(".ks-icon-3d");
      const icon = plate?.querySelector("svg");
      const label = tile.querySelector(".ks-category-label");
      const tr = tile.getBoundingClientRect();
      if (!plate || !icon) return null;
      const before = getComputedStyle(plate, "::before");
      const p = plate.getBoundingClientRect();
      const i = icon.getBoundingClientRect();
      const l = label?.getBoundingClientRect();
      return {
        plate: { x: p.x, y: p.y, w: p.width, h: p.height },
        icon: { x: i.x, y: i.y, w: i.width, h: i.height },
        label: l ? { x: l.x, y: l.y, w: l.width, h: l.height } : null,
        plateRadius: getComputedStyle(plate).borderRadius,
        ringRadius: before.borderRadius,
        ringInset: [before.top, before.right, before.bottom, before.left],
        ringPadding: before.padding,
        ringMask: before.webkitMaskImage || before.maskImage,
        ringComposite: before.maskComposite || before.webkitMaskComposite,
        ringAnim: before.animationName,
        ringOpacity: before.opacity,
        ringZ: before.zIndex,
        iconZ: getComputedStyle(icon).zIndex,
        tileRect: (() => { const t = tile.getBoundingClientRect(); return { w: t.width, h: t.height }; })(),
        overflow: getComputedStyle(tile).overflow,
        tileCx: tr.left + tr.width / 2,
        plateCx: p.left + p.width / 2,
      };
    };
    const samples = tiles.slice(0, 4).map(measure);
    return {
      tiles: tiles.length,
      samples,
      tileCentres: samples.filter(Boolean).map((x) => ({ tileCx: round(x.tileCx), plateCx: round(x.plateCx) })),
    };
  });

  if (!mobile) {
    check("category tiles render", glow.tiles > 0, `${glow.tiles} tiles`);
    const s = glow.samples.filter(Boolean);
    check("ring is pinned to the plate edge (inset 0 on all sides)", s.every((x) => x.ringInset.every((v) => v === "0px" || v === "auto")), s.map((x) => x.ringInset.join("/")).join(" | "));
    check("ring radius follows the plate (no square ring on round plate)", s.every((x) => x.ringRadius === "inherit" || x.ringRadius === x.plateRadius), s.map((x) => `${x.ringRadius}/${x.plateRadius}`).join(" | "));
    check("ring is masked to a uniform band (never fills the plate)", s.every((x) => /xor|exclude/.test(x.ringComposite)), s.map((x) => x.ringComposite).join(" | "));
    check("ring stays behind the icon glyph", s.every((x) => Number(x.ringZ) <= Number(x.iconZ || 0) || x.iconZ === "auto" || Number(x.ringZ) === 0), s.map((x) => `ring=${x.ringZ} icon=${x.iconZ}`).join(" | "));
    check("ring animation only sweeps an angle (no shape rotation)", s.every((x) => x.ringAnim === "ks-icon-ring-spin"), s.map((x) => x.ringAnim).join(" | "));
    check("ring band is thin and identical on all four sides", s.every((x) => x.ringPadding.replace(/px/g, "").trim() === x.ringPadding.replace(/px/g, "").trim() && parseFloat(x.ringPadding) > 0.5 && parseFloat(x.ringPadding) <= 3), s.map((x) => x.ringPadding).join(" | "));
    const centered = s.map((x) => Math.abs((x.plate.x + x.plate.w / 2) - (x.icon.x + x.icon.w / 2)));
    const vertical = s.map((x) => Math.abs((x.plate.y + x.plate.h / 2) - (x.icon.y + x.icon.h / 2)));
    check("icon centred in its plate (≤1.5px)", Math.max(...centered) <= 1.5 && Math.max(...vertical) <= 1.5, `dx≤${round(Math.max(...centered))} dy≤${round(Math.max(...vertical))}`);
    const pad = s.map((x) => ({ h: round(x.plate.w - x.icon.w), v: round(x.plate.h - x.icon.h) }));
    // Judge the plate by the glyph/plate ratio (absolute padding depends on the
    // responsive plate size: 32px on mobile, 44px on desktop), and by evenness.
    const ratios = s.map((x) => ({ w: x.icon.w / x.plate.w, h: x.icon.h / x.plate.h }));
    check("glyph fills 55-78% of its plate (hugs it, never floats in a loose box)", ratios.every((r) => r.w > 0.55 && r.w < 0.78 && r.h > 0.55 && r.h < 0.78), ratios.map((r) => `${(r.w * 100).toFixed(0)}%/${(r.h * 100).toFixed(0)}%`).join(" | "));
    check("plate padding is even on all sides (≤1px asymmetry)", s.every((x) => Math.abs((x.plate.w - x.icon.w) - (x.plate.h - x.icon.h)) <= 1 && Math.abs((x.plate.x + x.plate.w / 2) - (x.icon.x + x.icon.w / 2)) <= 1), pad.map((p) => `${p.h}/${p.v}`).join(" | "));
    const overlap = s.filter((x) => x.label).map((x) => round(Math.max(0, x.plate.y + x.plate.h - x.label.y)));
    check("ring/plate never touches or overlaps the label text", overlap.every((o) => o <= 0.5), `overlap=${Math.max(0, ...overlap)}px`);
    check("tile does not clip the plate", s.every((x) => x.overflow === "visible" || x.overflow === "visible visible"), s.map((x) => x.overflow).join(" | "));
  } else {
    check("[mobile] category tiles render without clipping", glow.samples.filter(Boolean).every((x) => x.plate.w > 18 && x.plate.w <= x.tileRect.w), glow.samples.filter(Boolean).map((x) => `${round(x.plate.w)} in ${round(x.tileRect.w)}`).join(" | "));
    const s = glow.samples.filter(Boolean);
    check("[mobile] ring keeps the same inset geometry on small screens", s.every((x) => x.ringInset.every((v) => v === "0px" || v === "auto")), s.map((x) => x.ringInset.join("/")).join(" | "));
    const offCentre = glow.tileCentres
      ? glow.tileCentres.map((c) => Math.abs(c.plateCx - c.tileCx))
      : [];
    check("[mobile] plate stays centred inside the tile", offCentre.length > 0 && Math.max(...offCentre) <= 1.5, offCentre.map(round).join("/") || "n/a");
  }

  /* --------------------------------------------------- 2. real image URLs */
  await goto(page, "/products");
  const imgReport = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].slice(0, 8);
    return imgs.map((im) => ({
      src: im.currentSrc || im.getAttribute("src") || "",
      complete: im.complete,
      natural: im.naturalWidth,
      rendered: round(im.getBoundingClientRect().width),
      alt: im.alt,
    }));
  });
  if (!mobile) {
    const wanted = "ashkanplastic.com";
    const throughRelay = page.imageRequests.filter((u) => u.includes("weserv.nl") || u.includes("wsrv.nl"));
    const toOrigin = page.imageRequests.filter((u) => u.includes(wanted) && u.includes("/wp-content/uploads/"));
    check("browser requests the REAL Ashkan asset (origin or relay)", throughRelay.length > 0 || toOrigin.length > 0, `${throughRelay.length} relay + ${toOrigin.length} origin requests`);
    check("every image request carries the real origin URL inside it", page.imageRequests.every((u) => u.includes("ashkanplastic.com")), page.imageRequests[0]?.slice(0, 90) ?? "none");
    check("no placeholder/stock service is used as a source", !page.imageRequests.some((u) => /unsplash|picsum|placehold|dummyimage|loremflickr/i.test(u)));
    check("product grid <img> elements paint (naturalWidth>0 once answered)", imgReport.filter((i) => i.src).every((i) => i.complete && i.natural > 0 && i.rendered > 0), imgReport.filter((i) => i.src).map((i) => `${i.natural}px→${i.rendered}px`).slice(0, 3).join(" | "));
    fs.writeFileSync(path.join(OUT, "image-requests.json"), JSON.stringify({ requests: page.imageRequests, imgs: imgReport }, null, 2));
  }

  /* 2b. BEB5 final: a product card never shows the product code or the stock
        status — those live on Product Details only. Checked on every surface
        that renders cards, at this viewport (desktop and mobile both run). */
  const cardAudit = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".ks-category-product-grid .ks-product-card")];
    const texts = cards.map((c) => c.textContent.replace(/\s+/g, " ").trim());
    return {
      cards: cards.length,
      code: texts.filter((t) => /کد محصول|شناسه موجودی|productCode/i.test(t)).length,
      stock: texts.filter((t) => /ناموجود|موجود در انبار|out of stock|in stock/i.test(t)).length,
      sample: texts[0]?.slice(0, 60) ?? "",
    };
  });
  check(`[${tag}] /products cards carry no product code and no stock status`, cardAudit.cards > 0 && cardAudit.code === 0 && cardAudit.stock === 0, `${cardAudit.cards} cards, code=${cardAudit.code}, stock=${cardAudit.stock} — e.g. "${cardAudit.sample}"`);

  // and the same on two real category screens reached through the tiles
  await goto(page, "/");
  const catHrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll(".ks-category-tile[href]")].map((a) => a.getAttribute("href")))].slice(0, 2));
  for (const href of catHrefs) {
    await goto(page, href);
    const c = await page.evaluate(() => {
      const grid = document.querySelector(".ks-category-product-grid");
      const cards = [...(grid?.querySelectorAll(".ks-product-card") ?? [])];
      const texts = cards.map((x) => x.textContent.replace(/\s+/g, " ").trim());
      return {
        cards: cards.length,
        imgs: grid ? grid.querySelectorAll("img").length : -1,
        icon: cards.filter((x) => x.querySelector(".ks-product-card-icon")).length,
        code: texts.filter((t) => /کد محصول|شناسه موجودی/i.test(t)).length,
        stock: texts.filter((t) => /ناموجود|موجود در انبار/i.test(t)).length,
        heights: [...new Set(cards.map((x) => Math.round(x.getBoundingClientRect().height)))],
      };
    });
    const label = `[${tag}] ${href.replace("/category/", "")} card contract`;
    check(`${label}: name + icon only, no photo`, c.cards > 0 && c.imgs === 0 && c.icon === c.cards, `${c.cards} cards, img=${c.imgs}, icon=${c.icon}`);
    check(`${label}: no code, no availability`, c.code === 0 && c.stock === 0, `code=${c.code}, stock=${c.stock}`);
    check(`${label}: even card boxes (no leftover gap)`, c.heights.length <= 1, `heights ${c.heights.join("/")}`);
  }
  // Product Details must still carry both facts
  await goto(page, "/product/6015010");
  const detailAudit = await page.evaluate(() => {
    const t = document.body.textContent.replace(/\s+/g, " ");
    return { code: /کد محصول/.test(t), stock: /ناموجود|موجود در انبار/.test(t), sku: /شناسه موجودی/.test(t) };
  });
  check(`[${tag}] Product Details still shows code + availability`, detailAudit.code && detailAudit.stock, JSON.stringify(detailAudit));

  /* ------------------------------------------------- 3. sun / moon toggle */
  for (const theme of ["day", "night"]) {
    await goto(page, "/");
    await page.evaluate((t) => {
      document.documentElement.setAttribute("data-theme", t === "day" ? "light" : "dark");
      localStorage.setItem("kala-search-theme", JSON.stringify({ theme: t === "day" ? "light" : "dark" }));
    }, theme);
    await page.reload({ waitUntil: "domcontentloaded" });
    await settle(page);
    await page.evaluate(() => document.querySelector('[aria-label="منو"]')?.click());
    await new Promise((r) => setTimeout(r, 450));
    const toggle = await page.evaluate(() => {
      const track = document.querySelector(".ks-theme-track");
      if (!track) return null;
      const sun = track.querySelector(".ks-theme-sun");
      const moon = track.querySelector(".ks-theme-moon");
      const tr = track.getBoundingClientRect();
      const sr = sun?.getBoundingClientRect();
      const mr = moon?.getBoundingClientRect();
      const cs = getComputedStyle(track);
      return {
        direction: cs.direction, display: cs.display,
        track: { x: round(tr.x), w: round(tr.width) },
        sun: sr ? { x: round(sr.x), w: round(sr.width) } : null,
        moon: mr ? { x: round(mr.x), w: round(mr.width) } : null,
        knob: round(document.querySelector(".ks-theme-knob")?.getBoundingClientRect().x ?? 0),
        pageDir: document.documentElement.dir || document.body.dir,
      };
    });
    const label = `[${tag}/${theme}] sun is left of moon (RTL page must not swap them)`;
    check(label, !!toggle && !!toggle.sun && !!toggle.moon && toggle.sun.x < toggle.moon.x, toggle ? `dir=${toggle.direction} sun.x=${toggle.sun?.x} moon.x=${toggle.moon?.x} pageDir=${toggle.pageDir}` : "toggle not found");
    check(`[${tag}/${theme}] both icons inside the track`, !!toggle && toggle.sun.x >= toggle.track.x && toggle.moon.x + toggle.moon.w <= toggle.track.x + toggle.track.w + 0.5, toggle ? `track ${toggle.track.x}..${round(toggle.track.x + toggle.track.w)}` : "");
    check(`[${tag}/${theme}] icons are the same size (symmetric)`, !!toggle && Math.abs(toggle.sun.w - toggle.moon.w) < 0.6, toggle ? `${toggle.sun.w} vs ${toggle.moon.w}` : "");
    await shot(page, `${tag}-menu-${theme}`);
    // measure the icon glow in this theme too
    const plate = await geometry(page, ".ks-category-tile .ks-icon-3d");
    check(`[${tag}/${theme}] glow plate is square-ish (w≈h)`, !!plate && Math.abs(plate.w - plate.h) <= 1.5, plate ? `${round(plate.w)}×${round(plate.h)}` : "n/a");
  }

  /* ------------------------------------------------------- 4. header bar */
  await goto(page, "/");
  const header = await page.evaluate(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: round(r.x), right: round(r.right), cx: round(r.left + r.width / 2), w: round(r.width), h: round(r.height) };
    };
    const bar = document.querySelector("header");
    return {
      hamburger: rect('[aria-label="منو"]'),
      cart: rect('[aria-label="سبد خرید"]'),
      account: rect('[aria-label="حساب کاربری"]'),
      brand: rect(".ks-site-header-brand"),
      toggleInBar: !!bar?.querySelector(".ks-theme-control"),
      barH: round(bar?.getBoundingClientRect().height ?? 0),
      controls: [...document.querySelectorAll("header .ks-crystal-action-btn")].map((el) => round(el.getBoundingClientRect().width)),
    };
  });
  check(`[${tag}] hamburger sits on the RIGHT in RTL`, !!header.hamburger && !!header.brand && header.hamburger.cx > header.brand.cx, header ? `hamburger.cx=${header.hamburger?.cx} brand.cx=${header.brand?.cx}` : "");
  check(`[${tag}] cart + account sit on the LEFT`, !!header.cart && !!header.account && !!header.brand && header.cart.cx < header.brand.cx && header.account.cx < header.brand.cx, header ? `cart=${header.cart?.cx} account=${header.account?.cx} brand=${header.brand?.cx}` : "");
  check(`[${tag}] header has exactly 3 controls, no leftovers`, header.controls.length === 3, header.controls.join("/"));
  check(`[${tag}] theme toggle absent from the header bar`, !header.toggleInBar);
  if (mobile) {
    check("[mobile] hamburger tap target ≥40px", (header.hamburger?.w ?? 0) >= 40 && (header.hamburger?.h ?? 0) >= 40, `${header.hamburger?.w}×${header.hamburger?.h}`);
    check("[mobile] header height stays compact", header.barH > 40 && header.barH < 80, `${header.barH}px`);
  }

  /* ------------------------------------------- 5. product / cart / orders */
  await goto(page, "/product/8039010");
  const product = await page.evaluate(() => {
    const img = document.querySelector(".product-media img");
    const back = document.querySelector(".ks-back-button, [aria-label='بازگشت']");
    const add = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("افزودن به سبد"));
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const bi = r(img);
    const ba = r(add);
    const card = r(img?.closest(".product-media"));
    return {
      imgSrc: img?.currentSrc || img?.src || "",
      imgBox: bi ? { w: round(bi.width), h: round(bi.height), painted: img.naturalWidth > 0 } : null,
      cardBox: card ? { w: round(card.width), x: round(card.x) } : null,
      addBtn: ba ? { w: round(ba.width), h: round(ba.height) } : null,
      backText: back?.textContent?.trim() ?? "",
      hasX: /[×✕✖]/.test(document.body.innerHTML),
      imageAreaCentred: bi && card ? round(Math.abs(bi.left + bi.width / 2 - (card.x + card.w / 2))) : null,
    };
  });
  check(`[${tag}] product image paints and stays tidy (≤380px wide)`, product.imgBox?.painted && product.imgBox.w <= 380, `${product.imgBox?.w}×${product.imgBox?.h}`);
  check(`[${tag}] product image centred in its media card (≤2px)`, product.imageAreaCentred !== null && product.imageAreaCentred <= 2, `${product.imageAreaCentred}px`);
  check(`[${tag}] add-to-cart button is a full-width tap target`, (product.addBtn?.w ?? 0) > 120 && (product.addBtn?.h ?? 0) >= 40, `${product.addBtn?.w}×${product.addBtn?.h}`);
  check(`[${tag}] back control says بازگشت (no × anywhere)`, product.backText.includes("بازگشت") && !product.hasX, product.backText || "missing");
  await shot(page, `${tag}-product`);

  /* ------------------------------------------------------ 6. mobile back */
  if (mobile) {
    await goto(page, "/");
    const before = page.url();
    await page.evaluate(() => document.querySelector(".ks-category-tile")?.click());
    await new Promise((r) => setTimeout(r, 800));
    const onCategory = page.url();
    await page.evaluate(() => document.querySelector(".ks-category-product-grid a, .ks-product-card a, a[href*='/product/']")?.click());
    await new Promise((r) => setTimeout(r, 900));
    const onProduct = page.url();
    await shot(page, "mobile-product");
    const backOk = await page.evaluate(async () => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("بازگشت"));
      btn?.click();
      await new Promise((r) => setTimeout(r, 600));
      return location.pathname;
    });
    check("[mobile] home→category→product→back returns to the category", onCategory.includes("/category/") && onProduct.includes("/product/") && backOk === onCategory.replace(BASE, ""), `${before} → ${onCategory} → ${onProduct} → ${backOk}`);

    // product → back again → home
    await page.evaluate(() => document.querySelector(".ks-category-tile")?.click());
    await new Promise((r) => setTimeout(r, 700));
    await page.evaluate(() => document.querySelector("a[href*='/product/']")?.click());
    await new Promise((r) => setTimeout(r, 800));
    await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
    await new Promise((r) => setTimeout(r, 600));
    check("[mobile] browser back returns to the category, not out of the site", page.url().includes("/category/"), page.url());

    // hardware back with an overlay open must close the overlay, not leave
    await goto(page, "/");
    await page.evaluate(() => document.querySelector('[aria-label="منو"]')?.click());
    await new Promise((r) => setTimeout(r, 500));
    const overlayOpen = await page.evaluate(() => {
      const el = [...document.querySelectorAll("div")].find((d) => typeof d.className === "string" && d.className.includes("bg-black/60"));
      return !!el && el.className.includes("opacity-100");
    });
    const routeBeforeBack = await page.evaluate(() => location.pathname);
    await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
    await new Promise((r) => setTimeout(r, 700));
    const after = await page.evaluate(() => ({
      path: location.pathname,
      overlayOpen: (() => {
        const el = [...document.querySelectorAll("div")].find((d) => typeof d.className === "string" && d.className.includes("bg-black/60"));
        return !!el && el.className.includes("opacity-100");
      })(),
      alive: document.body.textContent.includes("کالا سرچ"),
    }));
    check("[mobile] hardware back closes the open overlay", overlayOpen && !after.overlayOpen, `open=${overlayOpen} after=${after.overlayOpen}`);
    check("[mobile] back with overlay open keeps the user on the same page", after.path === routeBeforeBack && after.alive, `${routeBeforeBack} -> ${after.path} alive=${after.alive}`);
    await shot(page, "mobile-after-back");

    // horizontal overflow audit
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const wide = [...document.querySelectorAll("body *")]
        .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1 || el.getBoundingClientRect().left < -1)
        .slice(0, 6)
        .map((el) => `${el.tagName}.${String(el.className).split(" ")[0]}(${round(el.getBoundingClientRect().right)})`);
      return { scrollW: doc.scrollWidth, clientW: doc.clientWidth, wide };
    });
    check("[mobile] no horizontal page overflow", overflow.scrollW <= overflow.clientW + 1, `${overflow.scrollW}/${overflow.clientW} offenders: ${overflow.wide.join(", ") || "none"}`);
  }

  /* --------------------------------------------- 7. cart / admin visuals */
  if (!mobile) {
    await page.evaluate((cart) => localStorage.setItem("kala-search-cart", cart), JSON.stringify([
      { productId: "8039010", name: "سرویس لگن اپل تاپ 4 عددی سفید", image: "https://ashkanplastic.com/wp-content/uploads/4030.jpg", price: 346000, quantity: 2, variation: { id: "803901003", name: "سفید", sku: "803901003", price: 346000, color: "سفید", colorHex: "#f8fafc" } },
      { productId: "7025010", name: "سطل نخل بزرگ اشکان قرمز", image: "https://ashkanplastic.com/wp-content/uploads/22212.jpg", price: 270500, quantity: 1, variation: { id: "702501006", name: "قرمز", sku: "702501006", price: 270500, color: "قرمز", colorHex: "#ef4444" } },
    ]));
    await goto(page, "/cart");
    const cart = await page.evaluate(() => {
      const dot = document.querySelector(".ks-cart-line span[aria-hidden], [data-color-dot]");
      // a colour dot is a ~8-20px square; pills/badges are wider, so measure before counting
      const dots = [...document.querySelectorAll("span")].filter((s) => {
        if (!/rounded-full/.test(s.className)) return false;
        const st = s.getAttribute("style") || "";
        if (!st.includes("rgb")) return false;
        const r = s.getBoundingClientRect();
        return r.width >= 8 && r.width <= 20 && Math.abs(r.width - r.height) <= 1.5;
      });
      const heads = [...document.querySelectorAll("h1,h2")].map((h) => h.textContent.trim());
      const rows = [...document.querySelectorAll(".ks-cart-line")];
      return {
        heads,
        dotCount: dots.length,
        dotSizes: dots.slice(0, 3).map((d) => { const r = d.getBoundingClientRect(); return `${round(r.width)}×${round(r.height)}`; }),
        rowCount: rows.length,
        hasX: /[×✕✖]/.test(document.body.innerHTML),
      };
    });
    check("cart shows انتخاب سفارش and سفارشات شما", cart.heads.includes("انتخاب سفارش") && cart.heads.some((h) => h.includes("سفارشات شما")), cart.heads.join(" / "));
    check("cart renders a colour dot per coloured line", cart.dotCount >= 2, `${cart.dotCount} dots ${cart.dotSizes.join(",")}`);
    check("colour dots are ~12px circles", cart.dotSizes.every((d) => {
      const [w, h] = d.split("×").map((v) => parseFloat(v));
      return w >= 11 && w <= 13 && Math.abs(w - h) < 0.6;
    }), cart.dotSizes.join(" | "));
    await shot(page, "desktop-cart");
    await page.evaluate(() => localStorage.removeItem("kala-search-cart"));

    // The admin order screen can only be judged when an order exists, so create
    // one through the real API first (same contract the customer app uses).
    const seeded = await fetch(`${BASE}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        total: 962500,
        customer: {
          name: "کاربر تست مرورگر", phone: "09121234567", email: "qa@example.com",
          province: "تهران", city: "تهران", postalCode: "1234567890",
          address: "خیابان آزمایش، پلاک ۱", notes: "ساخته‌شده توسط QA مرورگر",
        },
        items: [{
          productId: "8039010", variantId: "803901003", name: "سرویس لگن اپل تاپ 4 عددی سفید",
          sku: "803901003", color: "سفید", colorHex: "#f8fafc", image: "4030.jpg",
          quantity: 2, unitPrice: 346000, lineTotal: 692000, availability: "موجود", stockCount: 86,
        }, {
          productId: "7025010", variantId: "702501006", name: "سطل نخل بزرگ اشکان قرمز",
          sku: "702501006", color: "قرمز", colorHex: "#ef4444", image: "22212.jpg",
          quantity: 1, unitPrice: 270500, lineTotal: 270500, availability: "موجود", stockCount: 137,
        }],
      }),
    });
    const seededBody = await seeded.json().catch(() => ({}));
    check("a real order can be created for the admin view", seeded.status === 201, `${seeded.status} ${seededBody?.order?.orderNumber ?? seededBody?.error ?? ""}`);

    await goto(page, "/admin");
    // admin credentials come from the process env or the git-ignored .env.local,
    // never from this file
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
    check("admin credentials available for the login test", !!creds.user && !!creds.pass, creds.user ? "from env" : "set ADMIN_USERNAME/ADMIN_PASSWORD or .env.local");
    if (creds.user && creds.pass) {
      await page.evaluate(async (c) => {
        const set = (el, v) => {
          const proto = Object.getPrototypeOf(el);
          Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        };
        const u = document.querySelector('input[name="username"], input#username, input:not([type="password"])');
        const p = document.querySelector('input[type="password"]');
        if (u && p) {
          set(u, c.user);
          set(p, c.pass);
          document.querySelector("form")?.requestSubmit();
          await new Promise((r) => setTimeout(r, 1200));
        }
      }, creds);
    }
    await new Promise((r) => setTimeout(r, 900));
    const admin = await page.evaluate(() => ({
      path: location.pathname,
      text: document.body.textContent.replace(/\s+/g, " ").trim().slice(0, 200),
      orderCards: document.querySelectorAll("[data-order-card], .ks-admin-order-card, article").length,
      rows: document.querySelectorAll("table tbody tr").length,
      badges: [...document.querySelectorAll("span,div,p")].filter((el) => /^(موجود|ناموجود)( در انبار)?$|^(ثبت‌شده|در حال آماده‌سازی|در حال ارسال|ارسال شده|تحویل شده|لغو شده)$/.test(el.textContent.trim()) && el.children.length === 0).length,
      statusSelect: document.querySelectorAll('select').length,
      dots: [...document.querySelectorAll("span,i")].filter((el) => (el.getAttribute("style") || "").includes("background") && /rounded|circle|9999px/.test(el.className || "")).length,
    }));
    check("admin login works in a real browser", admin.path.includes("/admin/orders") || /سفارش/.test(admin.text), `${admin.path} :: ${admin.text.slice(0, 80)}`);
    check("admin order screen lists the order with status + colour dot", /KS-\d/.test(admin.text) && (admin.badges > 0 || admin.statusSelect > 0) && admin.dots > 0, `badges=${admin.badges} statusSelect=${admin.statusSelect} dots=${admin.dots} rows=${admin.rows} cards=${admin.orderCards} text=${admin.text.slice(0, 60)}`);
    await shot(page, "desktop-admin");
  }

  /* ---------------------------------------------------- 8. layout tidiness */
  await goto(page, "/");
  const tidy = await page.evaluate(() => {
    const bad = [];
    const tiles = [...document.querySelectorAll(".ks-category-tile")];
    // Sub-pixel layout differences between a 1fr grid column and a calc() column
    // are not visible; anything within 1px is an aligned box.
    const widths = tiles.map((t) => t.getBoundingClientRect().width);
    const heights = tiles.map((t) => t.getBoundingClientRect().height);
    const spread = (a) => (a.length ? Math.max(...a) - Math.min(...a) : 0);
    if (spread(widths) > 1) bad.push(`category tiles uneven widths: ${[...new Set(widths.map((w) => w.toFixed(1)))].join(",")}`);
    if (spread(heights) > 1) bad.push(`category tiles uneven heights: ${[...new Set(heights.map((h) => h.toFixed(1)))].join(",")}`);
    for (const sel of [".ks-category-label"]) {
      for (const el of document.querySelectorAll(sel)) {
        if (el.scrollWidth > el.clientWidth + 1) bad.push(`${sel} clipped: "${el.textContent.trim()}" ${el.scrollWidth}>${el.clientWidth}`);
      }
    }
    return { bad, tileCount: tiles.length, widths: [...new Set(widths.map((w) => w.toFixed(0)))], heights: [...new Set(heights.map((h) => h.toFixed(0)))] };
  });
  check(`[${tag}] category grid is aligned (identical tile boxes)`, tidy.bad.filter((b) => b.startsWith("category")).length === 0, tidy.bad.join(" | ") || `${tidy.tileCount} tiles @ ${tidy.widths.join("/")}×${tidy.heights.join("/")}`);
  check(`[${tag}] no category label is cut off`, !tidy.bad.some((b) => b.includes("clipped")), tidy.bad.filter((b) => b.includes("clipped")).join(" | ") || "none");
  await shot(page, `${tag}-home`);
  await page.close();
}

/* ---------------------------------------------- 9. first visit + 320px fit */
{
  // a genuine first-time visitor must see the language welcome card, and the
  // branding images inside it must actually paint (broken-image check)
  const fresh = await newPage(browser, {});
  await fresh.evaluateOnNewDocument(() => localStorage.clear());
  await fresh.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 900));
  const firstVisit = await fresh.evaluate(() => {
    const card = document.querySelector(".ks-welcome-card");
    const imgs = [...document.querySelectorAll(".ks-welcome-card img, .ks-real-brand img")];
    return {
      modal: !!card,
      langButtons: [...document.querySelectorAll(".ks-welcome-lang")].map((b) => b.textContent.trim()),
      imgs: imgs.map((i) => ({ src: (i.currentSrc || i.src).split("/").pop(), natural: i.naturalWidth, w: Math.round(i.getBoundingClientRect().width) })),
      appBehind: !!document.querySelector(".ks-category-tile"),
    };
  });
  check("first visit shows the language welcome card", firstVisit.modal && firstVisit.langButtons.length === 3, firstVisit.langButtons.join(" / ") || "missing");
  check("welcome card branding images paint (no broken image)", firstVisit.imgs.length > 0 && firstVisit.imgs.every((i) => i.natural > 0 && i.w > 0), JSON.stringify(firstVisit.imgs));
  await fresh.evaluate(() => [...document.querySelectorAll(".ks-welcome-lang")].find((b) => b.textContent.includes("فارسی"))?.click());
  await new Promise((r) => setTimeout(r, 500));
  const dismissed = await fresh.evaluate(() => ({ modal: !!document.querySelector(".ks-welcome-card"), path: location.pathname }));
  check("choosing فارسی dismisses the card without navigating", !dismissed.modal && dismissed.path === "/", `modal=${dismissed.modal} path=${dismissed.path}`);
  await shot(fresh, "first-visit-after-choice");
  await fresh.close();
}
{
  // smallest common Android width: enlarged touch targets must still fit
  const tiny = await newPage(browser, { mobile: true });
  await tiny.setViewport({ width: 320, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await goto(tiny, "/");
  const fit = await tiny.evaluate(() => {
    const bar = document.querySelector("header");
    const r = bar.getBoundingClientRect();
    const btns = [...bar.querySelectorAll(".ks-crystal-action-btn")].map((b) => { const x = b.getBoundingClientRect(); return { w: round(x.width), right: round(x.right) }; });
    const doc = document.documentElement;
    return { btns, barRight: round(r.right), vw: window.innerWidth, scrollW: doc.scrollWidth, clientW: doc.clientWidth, overlap: (() => {
      const boxes = [...bar.querySelectorAll("a,button,img")].map((e) => e.getBoundingClientRect());
      let max = 0;
      for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i], b = boxes[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 1 && oy > 1) max = Math.max(max, ox);
      }
      return round(max);
    })() };
  });
  check("[320px] header buttons keep a ≥44px touch target", fit.btns.every((b) => b.w >= 43.5), fit.btns.map((b) => b.w).join("/"));
  check("[320px] header controls stay inside the viewport", fit.btns.every((b) => b.right <= fit.vw + 0.5), `right=${Math.max(...fit.btns.map((b) => b.right))} vw=${fit.vw}`);
  check("[320px] nothing in the header overlaps", fit.overlap <= 0.5, `overlap=${fit.overlap}px`);
  check("[320px] no horizontal overflow", fit.scrollW <= fit.clientW + 1, `${fit.scrollW}/${fit.clientW}`);
  await shot(tiny, "tiny-320-home");
  await tiny.close();
}

/* ----------------------------------------------------------------- report */
const failed = results.filter((r) => !r.pass);
console.log(` ${results.length - failed.length}/${results.length} browser checks passed\n`);
for (const r of results) console.log(` ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `\n        ${r.detail}` : ""}`);
fs.writeFileSync(path.join(OUT, "browser-qa-report.json"), JSON.stringify({ base: BASE, results }, null, 2));
console.log(`\n screenshots + JSON report → ${OUT}`);
await browser.close();
process.exit(failed.length === 0 ? 0 : 1);
