# Spec: TokenLens v1 — Audit Pair → Audit Report

Status: ready-for-agent

## Problem Statement

Investors and analysts cannot trust crypto whitepapers: marketing language hides missing supply caps, and yield metrics ignore dilution. There is no reliable way to turn a document plus live market data into a verifiable report where every number is either literally cited from the source or computed by transparent math — never by an LLM guessing.

## Solution

TokenLens v1 runs an **Auditor**: the user supplies a Token (On-Chain Id + Market Alias), a Document text, and the system fetches a Market Snapshot. An **Extractor** (LLM) may only propose a `maxSupplyAmount` Claim with Evidence. The Auditor verifies citations against the Document, runs the Deterministic Engine, and returns an **Audit Report** with Claims, Caveats, and Findings (Pending Dilution, Missing Max Supply, Source Conflict). No score, no health labels, no narrative summary. Incomplete sources mean no Audit Pair and no Report.

## User Stories

1. As an analyst, I want to submit On-Chain Id and Market Alias myself, so that the audit never guesses the wrong token.
2. As an analyst, I want to paste or upload Document text, so that the audit is anchored to a concrete source I chose.
3. As an analyst, I want the Document stored with a content hash, so that I can prove later which text was audited.
4. As an analyst, I want an optional source URL recorded on the Document, so that I remember where the text came from without treating the URL as the source of truth.
5. As an analyst, I want ingestion to fail on unreadable/near-empty text, so that I do not get a fake audit on OCR garbage.
6. As an analyst, I want the readability threshold to be configurable with a sensible default (500 alphanumeric characters), so that ops can tune without changing domain rules.
7. As an analyst, I want a Market Snapshot taken at audit time, so that Findings reflect one coherent instant.
8. As an analyst, I want circulating supply in human token units, so that it matches how whitepapers state max supply.
9. As an analyst, I want market fetch failures to abort the audit entirely, so that I never see a partial “document-only” report pretending to be complete.
10. As an analyst, I want missing On-Chain Id or Market Alias to abort the audit, so that every Audit Pair has a clear Token identity.
11. As a skeptic, I want the Extractor to ignore marketing adjectives, so that hype does not become structured “facts”.
12. As a skeptic, I want the Extractor to refuse to infer numbers from words like “one billion” without digits, so that silence stays silence.
13. As a skeptic, I want only `maxSupplyAmount` extracted in v1, so that the report stays narrow and verifiable.
14. As a skeptic, I want each Found Claim to carry an exact citation, so that I can spot-check the Document myself.
15. As a skeptic, I want Found Claims whose citation is not in the Document to be rejected, so that hallucinations never reach the engine.
16. As a skeptic, I want citation checks after whitespace collapse and Unicode NFC, case-sensitive, so that line breaks do not break honest quotes but fuzzy matching cannot smuggle lies.
17. As a skeptic, I want Absent Claims to use null value and null citation, so that “not found” is unambiguous.
18. As a skeptic, I want Caveats copied literally and verified as substrings, so that fine print is visible and honest.
19. As a skeptic, I want Caveats not to change dilution math in v1, so that the engine stays deterministic and non-NLP.
20. As an analyst, I want a Missing Max Supply Finding when `maxSupplyAmount` is Absent, so that uncapped issuance risk is explicit.
21. As an analyst, I want a Pending Dilution Finding as a percentage when max supply is Found and circulating is available, so that I see how much supply is still off-market.
22. As an analyst, I want no “healthy/alert” label on dilution, so that an arbitrary 20% threshold does not masquerade as science.
23. As an analyst, I want a Source Conflict Finding when circulating exceeds max supply or max supply is ≤ 0, so that contradictions are not smoothed away.
24. As an analyst, I want the Audit Report without a narrative summary or score, so that marketing-shaped outputs cannot re-enter through the back door.
25. As a developer, I want to run the Auditor with stand-in Extractor and market providers in tests, so that CI does not depend on LLM or CoinGecko.
26. As a developer, I want to wire real Extractor (AI SDK + system prompt) and CoinGecko adapters for production, so that the same Auditor serves both test and live use.
27. As a developer, I want Zod validation on external API payloads and Extractor outputs before domain logic, so that contract drift fails fast.
28. As a developer, I want market/network failures as Result-style errors, so that the Auditor can abort cleanly without unhandled exceptions.
29. As a maintainer, I want an in-memory Audit Record repository in v1, so that reproducibility is designed in without forcing Postgres on day one.
30. As a maintainer, I want the Audit Record to keep Document text + hash, Pair inputs, verified Claims, and Findings, so that discarding the Document never silently breaks re-verification.
31. As an analyst, I want price on the Market Snapshot when available, so that future Findings can use it without another fetch (even if v1 Findings only need circulating).
32. As a skeptic, I want prompt-injection text inside the Document treated as inert data, so that the whitepaper cannot reprogram the Extractor.
33. As a product owner, I want TypeScript strict mode and runtime schemas, so that the harness matches the project’s engineering bar.
34. As a product owner, I want English domain types in code with Portuguese UI/prompt copy as needed, so that the glossary stays single-language in the model.
35. As an analyst, I want EVM-first On-Chain Id (`chainId` + `contractAddress`), so that identity is stable for the chains we support first.

## Implementation Decisions

- **Primary module**: Auditor — single entry that accepts Token ids, Document text (and optional URL), optional readability threshold; returns Audit Report or a hard error (no Pair).
- **Ports (injectable)**: Extractor port; Market Data port; Audit Record repository port (in-memory adapter for v1).
- **Real adapters (production wiring)**: Extractor via Vercel AI SDK `generateObject` + `system-prompt-extractor.txt`; Market Data via CoinGecko using Market Alias; schemas validated with Zod; failures as Result.
- **Test doubles**: same ports, controlled responses — production math and citation verification always real.
- **Document ingest**: normalize for storage/hash; reject below alphanumeric length threshold (default 500, configurable); do not call Extractor if rejected.
- **Claim v1**: only `maxSupplyAmount` (human units). No `hasMaxSupply`, governance, team allocation, or narrativeSummary.
- **Evidence rules**: Found ⇒ non-null value + non-empty citation that passes substring verify after Citation Normalization; Absent ⇒ null/null; failed verify ⇒ Claim does not feed the engine (treat as rejected / not Found for Findings).
- **Caveats**: optional verified substrings; informative on Report only.
- **Deterministic Engine Findings**: Missing Max Supply; Pending Dilution percent; Source Conflict (circulating > max or max ≤ 0). No severity labels.
- **Audit Pair**: require both ids + legible Document + successful Snapshot; else error (ADR-0003).
- **Stack**: TypeScript strict, Zod, AI SDK for Extractor adapter; no LLM in the engine.
- **Persistence**: repository port; in-memory v1; shape must allow later Postgres without glossary change.
- **Language**: English identifiers in domain/code; prompts may stay Portuguese.
- Respect ADRs 0001 (scope), 0002 (citation verify), 0003 (three legs).

## Testing Decisions

- **Good tests** assert observable Auditor outcomes only: error vs Report shape, which Findings appear, dilution percent, rejection of bad citations, Caveats present but not changing math. Do not assert internal private helpers or Zod issue strings as the main contract.
- **Single seam**: `Auditor.run` (or equivalent) with injected Extractor and Market Data doubles. Ideal: one seam for the feature.
- **Cover at least**: illegible Document; missing ids; market failure; Absent max supply → Missing Max Supply; Found + circulating → Pending Dilution; circulating > max → Source Conflict; max ≤ 0 → Source Conflict; citation not in Document → no dilution from that Claim; Caveat visible and math unchanged; spelled-out-only supply from double still Absent if that is how the double is scripted for the case.
- **Prior art**: none in repo (greenfield) — establish this suite as the template.

## Out of Scope

- On-chain reads (proxy, multisig, upgradeability)
- Team/investor allocation, vesting, unlock schedules
- Governance Claims from text
- Narrative summary, scores, ratings, healthy/alert thresholds
- Automatic On-Chain ↔ Market Alias resolution
- Atomic/wei units and decimals handling
- Continuous monitoring / feeds
- Postgres/Drizzle/Prisma as required runtime (port only)
- Fuzzy or case-insensitive citation matching
- Partial reports when market fails
- Non-EVM On-Chain Id schemes beyond a simple extensible shape if needed later

## Further Notes

- Domain glossary: root `CONTEXT.md`.
- Extractor guardrail file: `system-prompt-extractor.txt`.
- Feature slug for tracker: `v1-audit-pair`.
- Next step after this spec: `/to-tickets` to publish the task graph under `.scratch/v1-audit-pair/issues/`.
