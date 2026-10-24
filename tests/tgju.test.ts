import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSymbolPrice } from "../lib/tgju";

describe("TGJU profile timestamp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["2024-01-15 10:30:00", "2024-01-15T07:00:00.000Z"],
    ["2024-01-15T10:30:00+04:00", "2024-01-15T06:30:00.000Z"],
  ])("converts %s to %s", async (datetime, expected) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            response: {
              summary: { price: { plain: "100" } },
              info: { datetime, currency_unit: "ریال" },
            },
          }),
      })
    );

    const price = await fetchSymbolPrice(
      `timestamp-test-${datetime}`,
      "Timestamp test",
      "تومان",
      true
    );

    expect(price.updatedAt).toBe(expected);
  });
});
