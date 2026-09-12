import type { ExtractorPort } from "../auditor/index.js";
import {
  createAiSdkExtractor,
  type AiSdkExtractorDeps,
  type GenerateObjectFn,
} from "./lib/create-extractor.js";

export { createAiSdkExtractor };
export type { AiSdkExtractorDeps, GenerateObjectFn, ExtractorPort };
