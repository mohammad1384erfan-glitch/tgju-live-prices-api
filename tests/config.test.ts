import { describe, it, expect, vi, beforeEach } from "vitest";

// Top-level mock — will be hoisted by vitest
vi.mock("../lib/cache", () => ({
  getConfigCache: vi.fn().mockResolvedValue(null),
  setConfigCache: vi.fn().mockResolvedValue(undefined),
}));

// Set required env vars at module load time
process.env.ADMIN_KEY = "test-admin-key";
process.env.CACHE_TTL_SECONDS = "30";
process.env.RATE_LIMIT_PER_MINUTE = "60";
process.env.SANITY_CHECK_THRESHOLD = "25";

describe("Config defaults", () => {
  it("loads default config from environment variables", async () => {
    const { getConfig } = await import("../lib/config");
    const config = await getConfig();
    expect(config.ttlSeconds).toBe(30);
    expect(config.rateLimitPerMinute).toBe(60);
    expect(config.sanityCheckThreshold).toBe(25);
    expect(config.sanityCheckEnabled).toBe(true);
  });

  it("verifies admin key correctly", async () => {
    const { verifyAdminKey, getConfig } = await import("../lib/config");
    const config = await getConfig();
    expect(verifyAdminKey("test-admin-key", config)).toBe(true);
    expect(verifyAdminKey("wrong-key", config)).toBe(false);
    expect(verifyAdminKey("", config)).toBe(false);
  });

  it("saves updated config via setConfigCache", async () => {
    const { setConfigCache } = await import("../lib/cache");
    const { saveConfig } = await import("../lib/config");
    await saveConfig({ ttlSeconds: 60 });
    expect(setConfigCache).toHaveBeenCalledWith(
      expect.objectContaining({ ttlSeconds: 60 })
    );
  });
});

describe("defaultSelectedSymbols", () => {
  it("contains expected default symbols", async () => {
    const { defaultSelectedSymbols } = await import("../data/seed-symbols");
    expect(defaultSelectedSymbols).toEqual([
      "geram18",
      "geram24",
      "gold_global",
      "mesghal",
      "sekeb",
      "sekeb_old",
      "rob_sekkeh",
      "nim_sekeh",
      "gerami",
      "price_dollar_rl",
      "crypto-tether-toman",
    ]);
  });
});

describe("seedSymbols", () => {
  it("has at least 70 symbols", async () => {
    const { seedSymbols } = await import("../data/seed-symbols");
    expect(seedSymbols.length).toBeGreaterThanOrEqual(70);
  });

  it("covers all required categories", async () => {
    const { seedSymbols } = await import("../data/seed-symbols");
    const categories = new Set(seedSymbols.map((s) => s.category));
    expect(categories.has("gold")).toBe(true);
    expect(categories.has("coin")).toBe(true);
    expect(categories.has("currency")).toBe(true);
    expect(categories.has("crypto")).toBe(true);
    expect(categories.has("commodity")).toBe(true);
  });

  it("all symbols have required fields", async () => {
    const { seedSymbols } = await import("../data/seed-symbols");
    for (const sym of seedSymbols) {
      expect(sym.id).toBeTruthy();
      expect(sym.label).toBeTruthy();
      expect(sym.category).toBeTruthy();
      expect(sym.unit).toBeTruthy();
      expect(sym.source).toBe("tgju");
    }
  });
});
