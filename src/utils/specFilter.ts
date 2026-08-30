/**
 * Legacy CSV technical_spec rows for most products are bare counts (e.g. "12")
 * left over from the source inventory export. They are not meaningful
 * customer-facing copy, so they must never render as a lone number next to or
 * under a price. Genuine textual specifications are preserved everywhere.
 */
export function isBareNumberText(value: string | undefined | null): boolean {
  if (!value) return true;
  return /^[\d.,\s٬/-]+$/.test(value.trim());
}

/** Returns the spec only when it carries real textual information. */
export function meaningfulSpec(value: string | undefined | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-" || isBareNumberText(trimmed)) return "";
  return trimmed;
}
