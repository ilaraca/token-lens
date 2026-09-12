# Citations must pass deterministic substring verification

Trusting the Extractor’s `citation` without checking it against the stored Document would make Proof of Work cosmetic. We require fail-fast rejection of any Found Claim whose citation is not a substring of the Document after Citation Normalization (whitespace collapse + Unicode NFC, case-sensitive, no fuzzy match). Rejected alternatives: trust Zod shape only, soft `unverified` flags, or Levenshtein “close enough” — all reopen hallucination as first-class input to the Deterministic Engine.
