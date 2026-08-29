/** Normalizes an Iranian mobile number input (digits only, local part after 9). */
export function normalizeIranLocal(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}

export function isValidIranLocal(local: string): boolean {
  return /^9\d{9}$/.test(local);
}

export function formatIranPhoneDisplay(local: string): string {
  const digits = normalizeIranLocal(local);
  if (digits.length <= 3) return `+98 ${digits}`;
  if (digits.length <= 6) return `+98 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+98 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
}

export function toFullIranPhone(local: string): string {
  return `+98${normalizeIranLocal(local)}`;
}
