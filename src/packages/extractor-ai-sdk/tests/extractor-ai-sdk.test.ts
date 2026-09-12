import { describe, expect, it } from "vitest";
import { createAiSdkExtractor } from "../index.js";

const FOUND_CLAIM = {
  found: true as const,
  value: 21_000_000,
  citation: "max supply of 21000000",
  caveats: null,
};

describe("createAiSdkExtractor", () => {
  it("returns a Zod-parsed Found Claim from generateObject", async () => {
    const extractor = createAiSdkExtractor({
      generateObject: async () => ({ object: FOUND_CLAIM }),
      systemPrompt: "extractor prompt",
    });

    const claim = await extractor.extract(
      "The token has a max supply of 21000000 coins.",
    );

    expect(claim).toEqual(FOUND_CLAIM);
  });

  it("returns an Absent Claim when generateObject yields an invalid object", async () => {
    const extractor = createAiSdkExtractor({
      generateObject: async () => ({
        object: { found: true, value: "not-a-number" },
      }),
      systemPrompt: "extractor prompt",
    });

    const claim = await extractor.extract("any document");

    expect(claim).toEqual({
      found: false,
      value: null,
      citation: null,
      caveats: null,
    });
  });

  it("returns an Absent Claim when generateObject throws", async () => {
    const extractor = createAiSdkExtractor({
      generateObject: async () => {
        throw new Error("upstream timeout");
      },
      systemPrompt: "extractor prompt",
    });

    const claim = await extractor.extract("any document");

    expect(claim).toEqual({
      found: false,
      value: null,
      citation: null,
      caveats: null,
    });
  });

  it("maps Portuguese LLM fields onto an English Found Claim", async () => {
    const extractor = createAiSdkExtractor({
      generateObject: async () => ({
        object: {
          found: true,
          valor: 21_000_000,
          citacao_exata: "oferta máxima de 21000000",
          ressalvas: null,
        },
      }),
      systemPrompt: "extractor prompt",
    });

    const claim = await extractor.extract("oferta máxima de 21000000");

    expect(claim).toEqual({
      found: true,
      value: 21_000_000,
      citation: "oferta máxima de 21000000",
      caveats: null,
    });
  });

  // Optional live check. Without OPENAI_API_KEY this is skipped so CI stays green.
  it.skipIf(!process.env.OPENAI_API_KEY)(
    "returns a Zod-valid Claim from a live generateObject call",
    async () => {
      const extractor = createAiSdkExtractor();
      const documentText =
        "The protocol token has a maximum supply of 21000000 tokens. " +
        "No more than 21000000 will ever exist.";

      const claim = await extractor.extract(documentText);

      expect(isExtractorClaim(claim)).toBe(true);
    },
    60_000,
  );
});

function isExtractorClaim(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const claim = value as Record<string, unknown>;
  if (claim.found === false) {
    return claim.value === null && claim.citation === null;
  }
  if (claim.found === true) {
    return (
      typeof claim.value === "number" &&
      Number.isFinite(claim.value) &&
      typeof claim.citation === "string" &&
      claim.citation.length > 0 &&
      (claim.caveats === null || typeof claim.caveats === "string")
    );
  }
  return false;
}
