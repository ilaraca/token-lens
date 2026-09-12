import { ExtractorClaimSchema, type ExtractorClaim } from "../../auditor/index.js";
import { z } from "zod";

/** Absent Claim so Auditor can continue when the LLM or Zod contract fails. */
export const ABSENT_CLAIM: ExtractorClaim = {
  found: false,
  value: null,
  citation: null,
  caveats: null,
};

/**
 * LLM object aligned with system-prompt-extractor.txt (valor / citacao_exata / ressalvas).
 * Not titled Auditor; no narrativeSummary or governance fields.
 */
export const LlmExtractorOutputSchema = z.object({
  found: z.boolean(),
  valor: z.number().finite().nullable(),
  citacao_exata: z.string().nullable(),
  ressalvas: z.string().nullable(),
});

export function toExtractorClaimInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") {
    return raw;
  }
  const record = raw as Record<string, unknown>;
  if ("valor" in record || "citacao_exata" in record || "ressalvas" in record) {
    return {
      found: record.found,
      value: record.valor ?? null,
      citation: record.citacao_exata ?? null,
      caveats: record.ressalvas ?? null,
    };
  }
  return raw;
}

export function parseExtractorClaim(raw: unknown): ExtractorClaim {
  const parsed = ExtractorClaimSchema.safeParse(toExtractorClaimInput(raw));
  return parsed.success ? parsed.data : ABSENT_CLAIM;
}
