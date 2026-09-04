/**
 * Production-safe classification of POST /api/admin/login failures.
 *
 * The UI must never treat deployment problems (missing config, dead API,
 * MySQL errors) as "wrong password". Codes are the only thing shown to the
 * client — no DB names, hashes, stack traces, or credentials leak here.
 */

export const ADMIN_LOGIN_ERROR_CODES = [
  "invalid_credentials",
  "admin_not_configured",
  "server_error",
  "network_error",
] as const;

export type AdminLoginErrorCode = (typeof ADMIN_LOGIN_ERROR_CODES)[number];

export function classifyAdminLoginFailure(input: {
  network?: boolean;
  status?: number;
  error?: unknown;
}): AdminLoginErrorCode {
  if (input.network) return "network_error";

  const code = typeof input.error === "string" ? input.error : "";
  const status = Number(input.status) || 0;

  if (code === "admin_not_configured" || (status === 503 && (code === "" || code === "admin_not_configured"))) {
    return "admin_not_configured";
  }
  if (code === "invalid_credentials" || status === 401) {
    return "invalid_credentials";
  }
  if (code === "server_error" || status >= 500) {
    return "server_error";
  }
  // 404 / HTML / empty body: /api is not reaching PHP (routing or deploy).
  if (status === 404 || code === "not_found" || status === 0) {
    return "network_error";
  }
  if (code === "network_error") return "network_error";
  return "network_error";
}

export function adminLoginErrorI18nKey(code: string): string {
  switch (code) {
    case "admin_not_configured":
      return "admin.notConfigured";
    case "server_error":
      return "admin.serverError";
    case "network_error":
      return "admin.networkError";
    default:
      return "admin.invalidCredentials";
  }
}
