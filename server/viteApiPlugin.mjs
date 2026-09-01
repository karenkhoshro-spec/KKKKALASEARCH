import fs from "fs";
import path from "path";
import { handleApiRequest } from "./orderHandler.mjs";

/**
 * Server-only configuration for local preview. `ADMIN_*` values come from the
 * real environment when present, otherwise from the git-ignored `.env.local`
 * file — credentials are never stored in the repository.
 */
export function loadLocalEnv(root = process.cwd()) {
  const file = path.join(root, ".env.local");
  if (!fs.existsSync(file)) return false;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (key.startsWith("#") || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return true;
}

loadLocalEnv();

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
