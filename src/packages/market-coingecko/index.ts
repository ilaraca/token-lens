import type { MarketDataPort } from "../auditor/index.js";
import { createFetchSnapshot } from "./lib/fetch-snapshot.js";

export type { MarketDataPort };

export function createCoinGeckoMarketData(
  fetchImpl?: typeof fetch,
): MarketDataPort {
  const http = fetchImpl ?? globalThis.fetch.bind(globalThis);
  return {
    fetchSnapshot: createFetchSnapshot(http),
  };
}
