import { describe, expect, it } from "vitest";
import { createCoinGeckoMarketData } from "../index.js";
import { ethereumFixture } from "./fixtures/ethereum.js";

function jsonFetch(status: number, body: unknown): typeof fetch {
  return async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
}

function textFetch(status: number, body: string): typeof fetch {
  return async () => new Response(body, { status });
}

describe("createCoinGeckoMarketData", () => {
  it("maps a CoinGecko fixture to circulating human units", async () => {
    const market = createCoinGeckoMarketData(jsonFetch(200, ethereumFixture));

    const result = await market.fetchSnapshot("ethereum");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        circulating: 120526283.247,
        price: 2345.67,
      });
    }
  });

  it("omits price when current_price.usd is missing", async () => {
    const market = createCoinGeckoMarketData(
      jsonFetch(200, {
        market_data: { circulating_supply: 21_000_000 },
      }),
    );

    const result = await market.fetchSnapshot("bitcoin");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ circulating: 21_000_000 });
    }
  });

  it("returns failure on HTTP 404", async () => {
    const market = createCoinGeckoMarketData(
      jsonFetch(404, { error: "coin not found" }),
    );

    const result = await market.fetchSnapshot("not-a-coin");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("404");
    }
  });

  it("returns failure on HTTP 500", async () => {
    const market = createCoinGeckoMarketData(
      jsonFetch(500, { error: "upstream" }),
    );

    const result = await market.fetchSnapshot("ethereum");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("500");
    }
  });

  it("returns failure on garbage JSON", async () => {
    const market = createCoinGeckoMarketData(textFetch(200, "not-json{{{"));

    const result = await market.fetchSnapshot("ethereum");

    expect(result.ok).toBe(false);
  });

  it("returns failure on an unmappable body", async () => {
    const market = createCoinGeckoMarketData(
      jsonFetch(200, { id: "ethereum", market_data: { circulating_supply: "nope" } }),
    );

    const result = await market.fetchSnapshot("ethereum");

    expect(result.ok).toBe(false);
  });

  it("returns failure when fetch throws and does not throw to the caller", async () => {
    const market = createCoinGeckoMarketData(async () => {
      throw new Error("network down");
    });

    const result = await market.fetchSnapshot("ethereum");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("network down");
    }
  });
});
