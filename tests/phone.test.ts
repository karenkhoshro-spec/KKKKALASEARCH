import { describe, expect, it } from "vitest";
import { normalizeIranLocal, isValidIranLocal, toFullIranPhone } from "../src/utils/phone";

describe("Iran phone normalization", () => {
  it("normalizes 09358135230 and 9358135230 to +989358135230", () => {
    expect(normalizeIranLocal("09358135230")).toBe("9358135230");
    expect(normalizeIranLocal("9358135230")).toBe("9358135230");
    expect(toFullIranPhone("09358135230")).toBe("+989358135230");
    expect(toFullIranPhone("9358135230")).toBe("+989358135230");
    expect(isValidIranLocal(normalizeIranLocal("09358135230"))).toBe(true);
  });
});
