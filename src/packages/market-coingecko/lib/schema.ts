import { z } from "zod";

export const CoinGeckoCoinSchema = z.object({
  market_data: z.object({
    circulating_supply: z.number().finite(),
    current_price: z
      .object({
        usd: z.number().finite().optional(),
      })
      .optional(),
  }),
});

export const MarketSnapshotDataSchema = z.object({
  circulating: z.number().finite(),
  price: z.number().finite().optional(),
});

export type CoinGeckoCoin = z.infer<typeof CoinGeckoCoinSchema>;
