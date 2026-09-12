import { z } from "zod";

export const ExtractorClaimSchema = z.discriminatedUnion("found", [
  z.object({
    found: z.literal(false),
    value: z.null(),
    citation: z.null(),
    caveats: z.string().nullable(),
  }),
  z.object({
    found: z.literal(true),
    value: z.number().finite(),
    citation: z.string().min(1),
    caveats: z.string().nullable(),
  }),
]);

export type ExtractorClaim = z.infer<typeof ExtractorClaimSchema>;
