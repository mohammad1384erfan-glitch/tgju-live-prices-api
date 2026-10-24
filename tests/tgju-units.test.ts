import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSymbolPrice } from "../lib/tgju";

describe("TGJU profile price units", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("converts a rial-denominated domestic profile price to toman", async () => {
    vi.stubGlobal("fetch", profileFetch({
      price: { plain: "32,000,000" },
      info: { currency_unit: "ریال" },
    }));

    const price = await fetchSymbolPrice("geram18", "Gold", "تومان", true);

    expect(price.value).toBe(3_200_000);
  });

  it("keeps a USD-denominated global profile price unchanged", async () => {
    vi.stubGlobal("fetch", profileFetch({
      price: { plain: "2,500" },
      info: { currency_unit: "دلار" },
    }));

    const price = await fetchSymbolPrice("gold_global", "Global gold", "دلار", true);

    expect(price.value).toBe(2_500);
  });

  it("uses Tether's rial field instead of its USD price", async () => {
    vi.stubGlobal("fetch", profileFetch({
      price: { plain: "1" },
      irr_price: { plain: "2,679,690" },
      info: { currency_unit: "دلار" },
    }));

    const price = await fetchSymbolPrice(
      "crypto-tether-toman",
      "Tether",
      "تومان",
      true
    );

    expect(price.value).toBe(267_969);
  });

  it("uses gold-futures currency metadata for the onz alias", async () => {
    const fetch = profileFetch({
      price: { plain: "1,121,380,000" },
      info: { currency_unit: "ریال" },
    });
    vi.stubGlobal("fetch", fetch);

    const price = await fetchSymbolPrice("onz", "Gold futures", "تومان", true);

    expect(price.value).toBe(112_138_000);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/profile/gold_futures"),
      expect.any(Object)
    );
  });
});

function profileFetch(summary: Record<string, unknown>) {
  const { info, ...priceSummary } = summary;
  return vi.fn().mockResolvedValue({
    ok: true,
    text: async () =>
      JSON.stringify({
        response: {
          summary: priceSummary,
          info: {
            datetime: "2024-01-15 10:30:00",
            ...(info as Record<string, unknown> | undefined),
          },
        },
      }),
  });
}
