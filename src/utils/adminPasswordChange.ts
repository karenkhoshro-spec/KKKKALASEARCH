/** Client-side checks for POST /api/admin/change-password. Server re-validates. */

export function validateAdminPasswordChange(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): string | null {
  if (!input.currentPassword) return "current_password_required";
  if (!input.newPassword) return "new_password_required";
  if (input.newPassword.length < 4) return "password_too_short";
  if (input.newPassword !== input.confirmPassword) return "password_mismatch";
  return null;
}

export function adminPasswordChangeI18nKey(code: string): string {
  switch (code) {
    case "current_password_required":
      return "admin.currentPasswordRequired";
    case "new_password_required":
      return "admin.newPasswordRequired";
    case "password_too_short":
      return "admin.passwordTooShort";
    case "password_mismatch":
      return "admin.passwordMismatch";
    case "invalid_current_password":
      return "admin.invalidCurrentPassword";
    case "unauthorized":
      return "admin.invalidCredentials";
    case "server_error":
      return "admin.serverError";
    case "network_error":
      return "admin.networkError";
    default:
      return "errors.generic";
  }
}
