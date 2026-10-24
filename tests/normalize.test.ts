import { describe, it, expect } from "vitest";
import {
  normalizeToToman,
  formatPersianNumber,
  formatPersianChange,
  parseRawPrice,
  parseChangePercent,
  sanityCheck,
} from "../lib/normalize";

describe("normalizeToToman", () => {
  it("converts rial to toman based on the source unit", () => {
    expect(normalizeToToman(300_000_000, "rial")).toBe(30_000_000);
  });

  it("keeps already-toman values unchanged", () => {
    expect(normalizeToToman(32_000_000, "toman")).toBe(32_000_000);
  });

  it("keeps USD-denominated values unchanged", () => {
    expect(normalizeToToman(2_500, "USD")).toBe(2_500);
  });

  it("keeps native instrument values unchanged", () => {
    expect(normalizeToToman(500_000_000, "native")).toBe(500_000_000);
  });
});

describe("formatPersianNumber", () => {
  it("formats number with Persian digits and commas", () => {
    expect(formatPersianNumber(32_540_000)).toBe("۳۲٬۵۴۰٬۰۰۰");
  });

  it("formats small numbers", () => {
    expect(formatPersianNumber(1234)).toBe("۱٬۲۳۴");
  });

  it("formats zero", () => {
    expect(formatPersianNumber(0)).toBe("۰");
  });
});

describe("formatPersianChange", () => {
  it("formats positive change with + sign", () => {
    const result = formatPersianChange(1.2);
    expect(result).toContain("+");
    expect(result).toContain("٪");
  });

  it("formats negative change with - sign", () => {
    const result = formatPersianChange(-2.5);
    expect(result).toContain("-");
    expect(result).toContain("٪");
  });

  it("formats zero change", () => {
    const result = formatPersianChange(0);
    expect(result).toContain("+");
    expect(result).toContain("٪");
  });
});

describe("parseRawPrice", () => {
  it("parses numeric string", () => {
    expect(parseRawPrice("32,540,000")).toBe(32_540_000);
  });

  it("parses Persian digit string", () => {
    expect(parseRawPrice("۳۲۵۴۰۰۰۰")).toBe(32_540_000);
  });

  it("returns null for empty string", () => {
    expect(parseRawPrice("")).toBeNull();
  });

  it("returns null for non-numeric string", () => {
    expect(parseRawPrice("N/A")).toBeNull();
  });

  it("returns number directly if numeric", () => {
    expect(parseRawPrice(12345)).toBe(12345);
  });

  it("returns null for negative numbers", () => {
    expect(parseRawPrice("-500")).toBeNull();
  });
});

describe("parseChangePercent", () => {
  it("parses numeric change", () => {
    expect(parseChangePercent(1.5)).toBe(1.5);
  });

  it("returns 0 for null", () => {
    expect(parseChangePercent(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(parseChangePercent(undefined)).toBe(0);
  });

  it("parses string change", () => {
    expect(parseChangePercent("2.3")).toBe(2.3);
  });
});

describe("sanityCheck", () => {
  it("returns ok for positive value with no last known", () => {
    expect(sanityCheck(100, null)).toEqual({ ok: true });
  });

  it("rejects non-positive value", () => {
    const result = sanityCheck(0, 100);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("non-positive");
  });

  it("rejects negative value", () => {
    const result = sanityCheck(-1, 100);
    expect(result.ok).toBe(false);
  });

  it("accepts change within threshold", () => {
    // 10% change, threshold 25%
    const result = sanityCheck(110, 100, 25);
    expect(result.ok).toBe(true);
  });

  it("rejects change exceeding threshold", () => {
    // 50% change, threshold 25%
    const result = sanityCheck(150, 100, 25);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("50.0%");
  });

  it("respects custom threshold", () => {
    // 30% change with 35% threshold → ok
    expect(sanityCheck(130, 100, 35).ok).toBe(true);
    // 30% change with 20% threshold → fail
    expect(sanityCheck(130, 100, 20).ok).toBe(false);
  });
});
