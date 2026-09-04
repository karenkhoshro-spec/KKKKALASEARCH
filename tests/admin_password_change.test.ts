import { readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  adminLogin,
  changeAdminPassword,
  verifyAdminToken,
} from "../server/orderHandler.mjs";
import { runtimeFilePath } from "../server/orderStore.mjs";
import { validateAdminPasswordChange } from "../src/utils/adminPasswordChange";

const user = () => process.env.ADMIN_USERNAME || "";
const pass = () => process.env.ADMIN_PASSWORD || "";

afterEach(() => {
  try {
    unlinkSync(runtimeFilePath("admin_credentials.json"));
  } catch {
    /* no override file */
  }
});

describe("admin password change — client validation", () => {
  it("rejects empty current / new and mismatch", () => {
    expect(validateAdminPasswordChange({ currentPassword: "", newPassword: "abcd", confirmPassword: "abcd" })).toBe("current_password_required");
    expect(validateAdminPasswordChange({ currentPassword: "x", newPassword: "", confirmPassword: "" })).toBe("new_password_required");
    expect(validateAdminPasswordChange({ currentPassword: "x", newPassword: "ab", confirmPassword: "ab" })).toBe("password_too_short");
    expect(validateAdminPasswordChange({ currentPassword: "x", newPassword: "abcd", confirmPassword: "abce" })).toBe("password_mismatch");
    expect(validateAdminPasswordChange({ currentPassword: "x", newPassword: "abcd", confirmPassword: "abcd" })).toBeNull();
  });
});

describe("admin password change — Node local store", () => {
  it("requires an authenticated session", () => {
    const result = changeAdminPassword(pass(), "next-pass-1", "next-pass-1", "");
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toBe("unauthorized");
  });

  it("rejects the wrong current password", () => {
    const login = adminLogin(user(), pass());
    expect(login.ok).toBe(true);
    const result = changeAdminPassword("not-the-current", "next-pass-1", "next-pass-1", login.token as string);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("invalid_current_password");
  });

  it("rejects confirmation mismatch", () => {
    const login = adminLogin(user(), pass());
    const result = changeAdminPassword(pass(), "next-pass-1", "next-pass-2", login.token as string);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("password_mismatch");
  });

  it("stores a hash (not the raw password) and accepts the new password afterwards", () => {
    const login = adminLogin(user(), pass());
    expect(login.ok).toBe(true);
    const next = "next-pass-ok";
    const changed = changeAdminPassword(pass(), next, next, login.token as string);
    expect(changed.ok).toBe(true);
    expect(changed).not.toHaveProperty("password");
    expect(changed).not.toHaveProperty("passwordHash");

    expect(adminLogin(user(), pass()).ok).toBe(false);
    const again = adminLogin(user(), next);
    expect(again.ok).toBe(true);
    expect(verifyAdminToken(again.token)).toBe(true);

    const credFile = readFileSync(
      join(process.env.ORDER_STORE_PATH ? process.env.ORDER_STORE_PATH.replace(/orders\.json$/, "admin_credentials.json") : "", ""),
      "utf8",
    );
    expect(credFile).not.toContain(next);
    expect(credFile).toContain("scrypt:");
  });
});

describe("frontend / example files never ship a raw bootstrap password", () => {
  it("config.example.php has empty hash and empty plaintext password", () => {
    const example = readFileSync(join(process.cwd(), "php-api/config.example.php"), "utf8");
    expect(example).toMatch(/'admin_password_hash'\s*=>\s*''/);
    expect(example).toMatch(/'admin_password'\s*=>\s*''/);
    expect(example).not.toMatch(/password_hash\('admin'/);
  });

  it("React source does not embed a bootstrap password literal for login", () => {
    const login = readFileSync(join(process.cwd(), "src/pages/admin/AdminLoginPage.tsx"), "utf8");
    expect(login).not.toMatch(/password.*=.*["']admin["']/);
    const api = readFileSync(join(process.cwd(), "src/utils/ordersApi.ts"), "utf8");
    expect(api).not.toMatch(/["']admin["']\s*,\s*["']admin["']/);
  });
});
