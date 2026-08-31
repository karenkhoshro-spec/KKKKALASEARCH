import { handleApiRequest } from "./orderHandler.mjs";

export function kalaApiPlugin() {
  return {
    name: "kala-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) {
          next();
          return;
        }
        handleApiRequest(req, res).catch((error) => {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "server_error", message: String(error?.message || error) }));
        });
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith("/api/")) {
          next();
          return;
        }
        handleApiRequest(req, res).catch(() => {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "server_error" }));
        });
      });
    },
  };
}
