import { handleApiRequest } from "./orderHandler.mjs";

/**
 * Vite middleware that serves the /api/* endpoints in both dev (`vite`) and
 * preview (`vite preview`) modes. Internal errors are logged server-side but
 * the client only ever receives a generic message — no stack traces, paths or
 * environment details leak into responses.
 */
function handleApi(req, res, label) {
  handleApiRequest(req, res).catch((error) => {
    console.error(`[kala-api:${label}]`, error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    if (!res.writableEnded) {
      res.end(JSON.stringify({ error: "server_error" }));
    }
  });
}

export function kalaApiPlugin() {
  return {
    name: "kala-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) {
          next();
          return;
        }
        handleApi(req, res, "dev");
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) {
          next();
          return;
        }
        handleApi(req, res, "preview");
      });
    },
  };
}
