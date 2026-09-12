import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import type { ExtractorPort } from "../../auditor/index.js";
import {
  ABSENT_CLAIM,
  LlmExtractorOutputSchema,
  parseExtractorClaim,
} from "./schema.js";

export type GenerateObjectFn = (options: {
  model: unknown;
  schema: unknown;
  system: string;
  prompt: string;
  schemaName?: string;
}) => Promise<{ object: unknown }>;

export type AiSdkExtractorDeps = {
  generateObject?: GenerateObjectFn;
  model?: unknown;
  systemPrompt?: string;
};

const DEFAULT_MODEL_ID = "gpt-4o-mini";

/**
 * Real Extractor actor. `generateObject` throw or Zod failure returns an Absent
 * Claim so Auditor.run can continue instead of crashing.
 */
export function createAiSdkExtractor(
  deps: AiSdkExtractorDeps = {},
): ExtractorPort {
  const generate = deps.generateObject ?? defaultGenerateObject;
  const systemPrompt = deps.systemPrompt ?? loadSystemPrompt();
  const model = deps.model ?? (deps.generateObject ? "test-model" : openai(DEFAULT_MODEL_ID));

  return {
    async extract(documentText: string) {
      let object: unknown;
      try {
        const result = await generate({
          model,
          schema: LlmExtractorOutputSchema,
          schemaName: "maxSupplyAmount",
          system: systemPrompt,
          prompt: documentText,
        });
        object = result.object;
      } catch {
        return ABSENT_CLAIM;
      }
      return parseExtractorClaim(object);
    },
  };
}

function loadSystemPrompt(): string {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../../../");
  return readFileSync(join(root, "system-prompt-extractor.txt"), "utf8");
}

const defaultGenerateObject: GenerateObjectFn = async (options) => {
  const result = await generateObject({
    model: options.model as Parameters<typeof generateObject>[0]["model"],
    schema: LlmExtractorOutputSchema,
    schemaName: "maxSupplyAmount",
    system: options.system,
    prompt: options.prompt,
  });
  return { object: result.object };
};
