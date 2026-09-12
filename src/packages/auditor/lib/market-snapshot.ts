import { z } from "zod";

export const MarketSnapshotSchema = z.object({
  circulating: z.number().finite(),
  price: z.number().finite().optional(),
});

export type MarketSnapshot = z.infer<typeof MarketSnapshotSchema>;

export type MarketFetchResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };
