/**
 * KalaSearch — BEB5 performance comparison (before vs after, same machine)
 * =========================================================================
 * "before" = the committed state the session started from (4660893, built in a
 * git worktree and served on :4174). "after" = the current build on :4173.
 *
 * Both are measured by the same Chromium, the same viewport, the same route list,
 * the same number of runs (median of 3), with no image transport on either side —
 * so image *counts* are comparable (this sandbox cannot reach ashkanplastic.com,
 * and neither build can, so neither is penalised or rewarded for pixel bytes).
 *
 *   npm i --no-save puppeteer-core @sparticuz/chromium     (QA-only, not a project dep)
 *   node scripts/qa-perf.mjs [--before http://localhost:4174] [--after http://localhost:4173]
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { spawnSync } from "child_process";

const argv = process.argv.slice(2);
const arg = (n, f) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : f;
};
const BEFORE = String(arg("before", "http://localhost:4174")).replace(/\/$/, "");
const AFTER = String(arg("after", "http://localhost:4173")).replace(/\/$/, "");
const RUNS = Number(arg("runs", 3));
const OUT = path.resolve(arg("out", "../qa-screens/perf"));
fs.mkdirSync(OUT, { recursive: true });

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
    args: [...chromeArgs, "--no-sandbox", "--disable-dev-shm-usage", "--lang=fa", "--disable-renderer-backgrounding"],
  });
}

const INSTRUMENT = () => {
  window.__ks = { long: [], lcp: 0 };
  try {
    new PerformanceObserver((l) => window.__ks.long.push(...l.getEntries().map((e) => e.duration))).observe({ type: "longtask", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      const es = l.getEntries();
      const last = es[es.length - 1];
      if (last) window.__ks.lcp = last.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
};

const COLLECT = () => {
  const nav = performance.getEntriesByType("navigation")[0] || {};
  const paints = performance.getEntriesByType("paint");
  const fcp = (paints.find((p) => p.name === "first-contentful-paint") || {}).startTime || 0;
  const resources = performance.getEntriesByType("resource");
  const byUrl = new Map();
  let imageReqs = 0;
  let imgBytes = 0;
  for (const r of resources) {
    byUrl.set(r.name, (byUrl.get(r.name) || 0) + 1);
    if (r.initiatorType === "img" || /\.(png|jpe?g|webp|gif|avp?|svg)(\?|$)/i.test(new URL(r.name).pathname)) {
      imageReqs += 1;
      imgBytes += r.transferSize || 0;
    }
  }
  let dupes = 0;
  for (const [, n] of byUrl) if (n > 1) dupes += 1;
  const long = window.__ks ? window.__ks.long : [];
  const mem = performance.memory || {};
  return {
    domNodes: document.querySelectorAll("*").length,
    resources: resources.length,
    imageReqs,
    duplicateUrls: dupes,
    imageBytesKB: Math.round(imgBytes / 1024),
    transferKB: Math.round(resources.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
    fcpMs: Math.round(fcp),
    lcpMs: Math.round(window.__ks ? window.__ks.lcp : 0),
    dclMs: Math.round(nav.domContentLoadedEventEnd || 0),
    loadMs: Math.round(nav.loadEventEnd || 0),
    longTasks: long.length,
    longTaskMs: Math.round(long.reduce((a, b) => a + b, 0)),
    heapMB: Math.round((mem.usedJSHeapSize || 0) / 1048576),
  };
};

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2);
};

const browser = await launch();

async function measure(origin, route) {
  const samples = [];
  for (let i = 0; i < RUNS; i += 1) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(INSTRUMENT);
    // no cache priming beyond a warm JS parse: each run is a cold page
    await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    try {
      await page.waitForFunction(() => (performance.getEntriesByType("navigation")[0] || {}).loadEventEnd > 0, { timeout: 20000 });
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));
    samples.push(await page.evaluate(COLLECT));
    await page.close();
  }
  const keys = Object.keys(samples[0]);
  const out = {};
  for (const k of keys) out[k] = median(samples.map((s) => s[k]));
  out.route = route;
  out.origin = origin;
  return out;
}

/* resolve the category route from the live DOM so both sides get the same page */
const probe = await browser.newPage();
await probe.setViewport({ width: 1280, height: 900 });
await probe.goto(`${AFTER}/`, { waitUntil: "domcontentloaded" });
await new Promise((r) => setTimeout(r, 2000));
const categoryHref = await probe.evaluate(() => document.querySelector('.ks-category-tile[href]')?.getAttribute("href") || "/category/105");
await probe.close();

const ROUTES = ["/", categoryHref, "/product/6015010", "/products", "/search?q=%D8%B3%D8%A8%D8%AF"];
console.log(`category route: ${categoryHref}\n`);

const report = {};
for (const [label, origin] of [["before", BEFORE], ["after", AFTER]]) {
  report[label] = [];
  for (const route of ROUTES) {
    report[label].push(await measure(origin, route));
  }
}

const pad = (s, n) => String(s).padStart(n);
const fmt = (o) =>
  [
    pad(o.route.slice(0, 26), 26),
    pad(o.fcpMs, 6),
    pad(o.lcpMs, 7),
    pad(o.loadMs, 7),
    pad(o.domNodes, 8),
    pad(o.resources, 5),
    pad(o.imageReqs, 6),
    pad(o.duplicateUrls, 6),
    pad(o.longTasks, 5),
    pad(o.longTaskMs, 7),
    pad(o.heapMB, 6),
  ].join(" ");

console.log(`${"route".padEnd(26)} ${pad("FCP", 6)} ${pad("LCP", 7)} ${pad("load", 7)} ${pad("DOM", 8)} ${pad("req", 5)} ${pad("img", 6)} ${pad("dup", 6)} ${pad("LT", 5)} ${pad("LTms", 7)} ${pad("MB", 6)}`);
for (const label of ["before", "after"]) {
  console.log(`\n--- ${label} (${report[label][0].origin}) ---`);
  for (const o of report[label]) console.log(fmt(o));
}

console.log("\n--- after − before (negative is better) ---");
console.log(`${"route".padEnd(26)} ${pad("FCP", 6)} ${pad("LCP", 7)} ${pad("load", 7)} ${pad("DOM", 8)} ${pad("req", 5)} ${pad("img", 6)} ${pad("dup", 6)} ${pad("LT", 5)} ${pad("LTms", 7)} ${pad("MB", 6)}`);
const deltas = [];
for (let i = 0; i < ROUTES.length; i += 1) {
  const b = report.before[i];
  const a = report.after[i];
  const d = { route: b.route };
  for (const k of Object.keys(b)) if (typeof b[k] === "number") d[k] = a[k] - b[k];
  deltas.push(d);
  console.log(
    [
      d.route.slice(0, 26).padEnd(26),
      pad(d.fcpMs, 6),
      pad(d.lcpMs, 7),
      pad(d.loadMs, 7),
      pad(d.domNodes, 8),
      pad(d.resources, 5),
      pad(d.imageReqs, 6),
      pad(d.duplicateUrls, 6),
      pad(d.longTasks, 5),
      pad(d.longTaskMs, 7),
      pad(d.heapMB, 6),
    ].join(" "),
  );
}

fs.writeFileSync(path.join(OUT, "perf.json"), JSON.stringify({ before: report.before, after: report.after, deltas, generatedAt: new Date().toISOString() }, null, 2));
console.log(`\nwrote ${path.join(OUT, "perf.json")}`);
await browser.close();
