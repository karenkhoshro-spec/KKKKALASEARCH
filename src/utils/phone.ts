/** Normalizes an Iranian mobile number input (digits only, local part after 9). */
export function normalizeIranLocal(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}

export function isValidIranLocal(local: string): boolean {
  return /^9\d{9}$/.test(local);
}

export function toFullIranPhone(local: string): string {
  return `+98${normalizeIranLocal(local)}`;
}
