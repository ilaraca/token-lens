import type { MarketDataPort } from "../../auditor/index.js";
import {
  CoinGeckoCoinSchema,
  MarketSnapshotDataSchema,
  type CoinGeckoCoin,
} from "./schema.js";

const COINGECKO_COIN_URL = "https://api.coingecko.com/api/v3/coins";

export function createFetchSnapshot(
  fetchImpl: typeof fetch,
): MarketDataPort["fetchSnapshot"] {
  return async (marketAlias) => {
    let response: Response;
    try {
      response = await fetchImpl(coinUrl(marketAlias));
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }

    const coin = CoinGeckoCoinSchema.safeParse(body);
    if (!coin.success) {
      return { ok: false, error: "unmappable CoinGecko payload" };
    }

    const data = MarketSnapshotDataSchema.safeParse(
      mapCoinToSnapshot(coin.data),
    );
    if (!data.success) {
      return { ok: false, error: "unmappable CoinGecko payload" };
    }

    return { ok: true, data: data.data };
  };
}

function coinUrl(marketAlias: string): string {
  return `${COINGECKO_COIN_URL}/${encodeURIComponent(marketAlias)}`;
}

function mapCoinToSnapshot(
  coin: CoinGeckoCoin,
): { circulating: number; price?: number } {
  const circulating = coin.market_data.circulating_supply;
  const price = coin.market_data.current_price?.usd;
  if (price === undefined) {
    return { circulating };
  }
  return { circulating, price };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}
