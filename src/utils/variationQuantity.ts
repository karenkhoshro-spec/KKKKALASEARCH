export function variationQtyKey(variationId?: string | null): string {
  return variationId && variationId.length > 0 ? variationId : "base";
}

export function qtyForVariation(
  map: Record<string, number>,
  variationId?: string | null,
): number {
  return map[variationQtyKey(variationId)] ?? 0;
}

export function setQtyForVariation(
  map: Record<string, number>,
  variationId: string | null | undefined,
  quantity: number,
): Record<string, number> {
  return { ...map, [variationQtyKey(variationId)]: Math.max(0, quantity) };
}
