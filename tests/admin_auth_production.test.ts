import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  adminLoginErrorI18nKey,
  classifyAdminLoginFailure,
} from "../src/utils/adminLoginErrors";
import { adminLogin } from "../src/utils/ordersApi";
import { resolvePath } from "../src/i18n/translations";

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

describe("admin login error classification", () => {
  it("keeps invalid_credentials only for 401 / that error code", () => {
    expect(classifyAdminLoginFailure({ status: 401, error: "invalid_credentials" })).toBe("invalid_credentials");
    expect(classifyAdminLoginFailure({ status: 401 })).toBe("invalid_credentials");
  });

  it("does not disguise missing admin config as a wrong password", () => {
    expect(classifyAdminLoginFailure({ status: 503, error: "admin_not_configured" })).toBe("admin_not_configured");
    expect(classifyAdminLoginFailure({ status: 503 })).toBe("admin_not_configured");
  });

  it("maps server failures separately", () => {
    expect(classifyAdminLoginFailure({ status: 500, error: "server_error" })).toBe("server_error");
    expect(classifyAdminLoginFailure({ status: 500 })).toBe("server_error");
  });

  it("maps network / missing API separately", () => {
    expect(classifyAdminLoginFailure({ network: true })).toBe("network_error");
    expect(classifyAdminLoginFailure({ status: 404, error: "not_found" })).toBe("network_error");
    expect(classifyAdminLoginFailure({ status: 200, error: undefined })).toBe("network_error");
  });

  it("i18n keys exist in fa/en/ar and never mention a password value", () => {
    for (const lang of ["fa", "en", "ar"] as const) {
      for (const code of ["invalid_credentials", "admin_not_configured", "server_error", "network_error"]) {
        const key = adminLoginErrorI18nKey(code);
        const text = resolvePath(lang, key);
        expect(text, `${lang} ${key}`).toBeTruthy();
        expect(String(text).toLowerCase()).not.toMatch(/\$2y\$/);
        expect(String(text)).not.toMatch(/CHANGE_ME/);
      }
    }
  });
});

describe("adminLogin fetch contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the token on 200 {token}", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ token: "tok-1" }), { status: 200 })),
    );
    await expect(adminLogin("Orderx", "not-the-real-password")).resolves.toBe("tok-1");
  });

  it("throws admin_not_configured on 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "admin_not_configured" }), { status: 503 })),
    );
    await expect(adminLogin("Orderx", "x")).rejects.toThrow("admin_not_configured");
  });

  it("throws invalid_credentials on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "invalid_credentials" }), { status: 401 })),
    );
    await expect(adminLogin("karen", "nope")).rejects.toThrow("invalid_credentials");
  });

  it("throws server_error on 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "server_error" }), { status: 500 })),
    );
    await expect(adminLogin("Orderx", "x")).rejects.toThrow("server_error");
  });

  it("throws network_error when fetch fails or API 404s", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));
    await expect(adminLogin("Orderx", "x")).rejects.toThrow("network_error");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>spa</html>", { status: 404 })),
    );
    await expect(adminLogin("Orderx", "x")).rejects.toThrow("network_error");
  });
});

describe("secrets stay out of the frontend", () => {
  const frontendRoots = ["src", "public"];

  it("does not hardcode admin passwords, hashes, or session secrets in React/public", () => {
    const files = frontendRoots.flatMap((root) => walkFiles(join(process.cwd(), root)));
    const textFiles = files.filter((f) => /\.(ts|tsx|js|jsx|css|html|json|svg|txt|md)$/.test(f));
    for (const file of textFiles) {
      const body = readFileSync(file, "utf8");
      expect(body, file).not.toMatch(/ADMIN_PASSWORD_HASH/);
      expect(body, file).not.toMatch(/ADMIN_SESSION_SECRET/);
      expect(body, file).not.toMatch(/admin_password_hash/);
      expect(body, file).not.toMatch(/\$2y\$\d+\$/);
      expect(body, file).not.toMatch(/VITE_ADMIN_/);
    }
  });

  it("PHP template does not ship a real password or hash", () => {
    const example = readFileSync(join(process.cwd(), "php-api/config.example.php"), "utf8");
    expect(example).toContain("'admin_username'");
    expect(example).toMatch(/'admin_password_hash'\s*=>\s*''/);
    expect(example).toMatch(/'admin_password'\s*=>\s*''/);
    expect(example).not.toMatch(/\$2y\$\d+\$.{20,}/);
    expect(example).toMatch(/'admin_username'\s*=>\s*'Orderx'/);
    expect(example).not.toMatch(/'admin_username'\s*=>\s*'karen'/i);
  });

  it("PHP auth uses password_verify and never documents a live password", () => {
    const auth = readFileSync(join(process.cwd(), "php-api/lib/auth.php"), "utf8");
    expect(auth).toContain("password_verify");
    expect(auth).toContain("ks_admin_configured");
    expect(auth).toContain("REDIRECT_HTTP_AUTHORIZATION");
    expect(auth).not.toMatch(/\$2y\$\d+\$.{20,}/);
  });
});
