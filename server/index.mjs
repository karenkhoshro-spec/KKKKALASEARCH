/**
 * KalaSearch — standalone production server (no Vite required).
 *
 *   npm run build   # produces dist/
 *   npm run start   # -> node server/index.mjs
 *
 * Responsibilities:
 *  - Serve the built React app from dist/ (with correct content types, cache
 *    headers and 304 support).
 *  - Mount the existing /api/* handlers from ./orderHandler.mjs (orders,
 *    admin auth/orders, health) — the same logic the Vite dev plugin uses, so
 *    there is exactly one API implementation.
 *  - SPA fallback: unknown navigation requests return index.html; /api/*
 *    paths and file-like misses (e.g. missing .png) never get the HTML shell.
 *  - Never serve source, .env, or data files — only dist/ content is exposed.
 *
 * Configuration (environment variables):
 *  PORT              port to listen on (default 3000; Hostinger/proxy usually
 *                    provides one — if not set the app still works on 3000)
 *  HOST              bind address (default 0.0.0.0 — required behind proxies)
 *  ORDER_STORE_PATH  absolute path to orders.json on a persistent volume
 *                    (default: <project>/data/orders.json)
 *  ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_SESSION_SECRET
 *                    backend-only admin credentials (never VITE_*)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiRequest } from "./orderHandler.mjs";
import { ordersFilePath } from "./orderStore.mjs";

const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIR = path.join(PROJECT_ROOT, "dist");
const INDEX_HTML = path.join(DIST_DIR, "index.html");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || "3000");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
  ".zip": "application/zip",
  ".webmanifest": "application/manifest+json",
};

function sendJson(res, status, body) {
  if (res.writableEnded) return;
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function safeStat(file) {
  try {
    const stat = await fs.promises.stat(file);
    return stat;
  } catch {
    return null;
  }
}

function isApiPath(pathname) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, HEAD");
    res.end();
    return;
  }

  // 1. Resolve the requested path strictly inside dist/ (traversal-safe).
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const candidate = path.resolve(DIST_DIR, relative);
  const insideDist = candidate === DIST_DIR || candidate.startsWith(`${DIST_DIR}${path.sep}`);
  if (!insideDist) {
    sendJson(res, 404, { error: "not_found" });
    return;
  }

  let file = candidate;
  let stat = await safeStat(file);
  if (stat && stat.isDirectory()) {
    file = path.join(file, "index.html");
    stat = await safeStat(file);
  }

  // 2. SPA fallback: only for navigation-like requests. File-like misses
  //    (a path whose last segment contains a dot) return a real 404 so broken
  //    asset URLs never silently render the HTML shell.
  if (!stat || !stat.isFile()) {
    if (pathname !== "/" && path.basename(pathname).includes(".")) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }
    file = INDEX_HTML;
    stat = await safeStat(file);
    if (!stat || !stat.isFile()) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }
  }

  const ext = path.extname(file).toLowerCase();
  const contentType = MIME[ext] || "application/octet-stream";
  const isHtml = file === INDEX_HTML;

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Cache-Control",
    isHtml ? "no-cache, no-store, must-revalidate" : "public, max-age=86400",
  );
  res.setHeader("Last-Modified", stat.mtime.toUTCString());

  // 304 when the browser already has this exact revision.
  const ifModifiedSince = req.headers["if-modified-since"];
  if (ifModifiedSince) {
    const since = Date.parse(ifModifiedSince);
    if (Number.isFinite(since) && Math.floor(stat.mtimeMs / 1000) <= Math.floor(since / 1000)) {
      res.statusCode = 304;
      res.end();
      return;
    }
  }

  res.setHeader("Content-Length", stat.size);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    let pathname;
    try {
      pathname = new URL(req.url || "/", "http://local.invalid").pathname;
    } catch {
      sendJson(res, 400, { error: "bad_request" });
      return;
    }

    if (isApiPath(pathname)) {
      const handled = await handleApiRequest(req, res);
      if (!handled) sendJson(res, 404, { error: "not_found" });
      return;
    }

    await serveStatic(req, res, pathname);
  } catch (error) {
    console.error("[kala-server] request error:", error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "server_error" });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});

// Fail fast with a clear message when dist/ has not been built yet.
if (!fs.existsSync(INDEX_HTML)) {
  console.error("[kala-server] dist/index.html not found. Run `npm run build` first.");
  process.exit(1);
}

server.listen(PORT, HOST, () => {
  const address = server.address();
  const actualPort = address && typeof address === "object" ? address.port : PORT;
  console.log(`[kala-server] KalaSearch listening on http://${HOST}:${actualPort}`);
  console.log(`[kala-server] serving static files from ${DIST_DIR}`);
  console.log(`[kala-server] order store: ${ordersFilePath()}`);
  console.log(`[kala-server] admin configured: ${Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET)}`);
});

// Graceful shutdown (PM2/Hostinger restarts, SIGTERM/SIGINT).
function shutdown(signal) {
  console.log(`[kala-server] received ${signal}, shutting down gracefully…`);
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
