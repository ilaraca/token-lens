import { describe, expect, it } from "vitest";
import { createInMemoryAuditRecords, run } from "../index.js";
import type { ExtractorPort, MarketDataPort } from "../index.js";

const DEFAULT_THRESHOLD = 500;

function readableDocument(): string {
  return "a".repeat(DEFAULT_THRESHOLD);
}

function trackingPorts() {
  const calls = { extract: 0, fetchSnapshot: 0 };
  const extractor: ExtractorPort = {
    extract: async () => {
      calls.extract += 1;
      return { found: false, value: null, citation: null, caveats: null };
    },
  };
  const market: MarketDataPort = {
    fetchSnapshot: async () => {
      calls.fetchSnapshot += 1;
      return { ok: true, data: { circulating: 1, price: 1 } };
    },
  };
  return { calls, extractor, market };
}

describe("Auditor.run", () => {
  it("rejects a missing Market Alias without an Audit Report and without calling ports", async () => {
    const { calls, extractor, market } = trackingPorts();

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "",
        documentText: readableDocument(),
      },
      { extractor, market },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("incomplete_ids");
    }
    expect("report" in result).toBe(false);
    expect(calls.extract).toBe(0);
    expect(calls.fetchSnapshot).toBe(0);
  });

  it("rejects a missing On-Chain Id without calling ports", async () => {
    const { calls, extractor, market } = trackingPorts();

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "  " },
        marketAlias: "ethereum",
        documentText: readableDocument(),
      },
      { extractor, market },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("incomplete_ids");
    }
    expect(calls.extract).toBe(0);
    expect(calls.fetchSnapshot).toBe(0);
  });

  it("rejects a Document below the default alphanumeric threshold without calling ports", async () => {
    const { calls, extractor, market } = trackingPorts();

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: "a".repeat(DEFAULT_THRESHOLD - 1),
      },
      { extractor, market },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("illegible_document");
    }
    expect(calls.extract).toBe(0);
    expect(calls.fetchSnapshot).toBe(0);
  });

  it("rejects an illegible Document using a custom threshold", async () => {
    const { calls, extractor, market } = trackingPorts();

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: "token12",
        readabilityThreshold: 10,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("illegible_document");
    }
    expect(calls.extract).toBe(0);
    expect(calls.fetchSnapshot).toBe(0);
  });

  it("aborts without an Audit Report when Market Data fails", async () => {
    const calls = { extract: 0 };
    const extractor: ExtractorPort = {
      extract: async () => {
        calls.extract += 1;
        return { found: false, value: null, citation: null, caveats: null };
      },
    };
    const market: MarketDataPort = {
      fetchSnapshot: async () => ({ ok: false, error: "network" }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: readableDocument(),
      },
      { extractor, market },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("market_unavailable");
    }
    expect("report" in result).toBe(false);
    expect(calls.extract).toBe(0);
  });

  it("puts circulating human units on the Snapshot when the double succeeds", async () => {
    const { extractor, market } = trackingPorts();
    const circulating = 21_000_000;

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: readableDocument(),
      },
      {
        extractor,
        market: {
          fetchSnapshot: async (alias) => {
            expect(alias).toBe("ethereum");
            return { ok: true, data: { circulating, price: 2.5 } };
          },
        },
      },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.circulating).toBe(21_000_000);
      expect(result.snapshot.price).toBe(2.5);
      expect(result.report.findings).toEqual([{ type: "missing_max_supply" }]);
    }
  });

  it("fails fast on an invalid market contract without a partial Report", async () => {
    const { extractor } = trackingPorts();
    const market: MarketDataPort = {
      fetchSnapshot: async () => ({
        ok: true,
        data: { circulating: "not-a-number" },
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: readableDocument(),
      },
      { extractor, market },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("market_contract_invalid");
    }
    expect("report" in result).toBe(false);
    expect("snapshot" in result).toBe(false);
  });

  it("returns an Audit Report with Missing Max Supply when the Extractor Claim is Absent", async () => {
    const { extractor, market } = trackingPorts();

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: readableDocument(),
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.report.claims.maxSupplyAmount).toEqual({
      found: false,
      value: null,
      citation: null,
      caveats: null,
      verified: true,
    });
    expect(result.report.findings).toEqual([{ type: "missing_max_supply" }]);
    expect(result.report).not.toHaveProperty("score");
    expect(result.report).not.toHaveProperty("narrativeSummary");
  });

  it("rejects an Absent Claim that still carries a value or citation", async () => {
    const { market } = trackingPorts();
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: false,
        value: 1_000_000,
        citation: "nope",
        caveats: null,
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: readableDocument(),
      },
      { extractor, market },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("extractor_contract_invalid");
    }
    expect("report" in result).toBe(false);
  });

  it("does not feed the engine when a Found citation is not in the Document", async () => {
    const { market } = trackingPorts();
    const quote = "Max supply is 1000000";
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 1_000_000,
        citation: quote,
        caveats: null,
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: `${"a".repeat(DEFAULT_THRESHOLD)} no such number here`,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.report.claims.maxSupplyAmount.verified).toBe(false);
    expect(result.report.findings).toEqual([{ type: "missing_max_supply" }]);
  });

  it("verifies a literal citation when only whitespace differs", async () => {
    const { market } = trackingPorts();
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 1_000_000,
        citation: "Max supply is 1000000",
        caveats: null,
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: `${"a".repeat(DEFAULT_THRESHOLD)} Max\nsupply   is 1000000`,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.report.claims.maxSupplyAmount.verified).toBe(true);
    expect(
      result.report.findings.some((f) => f.type === "missing_max_supply"),
    ).toBe(false);
  });

  it("does not match citations case-insensitively or fuzzily", async () => {
    const { market } = trackingPorts();
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 1_000_000,
        citation: "max supply is 1000000",
        caveats: null,
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: `${"a".repeat(DEFAULT_THRESHOLD)} MAX SUPPLY IS 1000000`,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.report.claims.maxSupplyAmount.verified).toBe(false);
    expect(result.report.findings).toEqual([{ type: "missing_max_supply" }]);
  });

  it("reports Pending Dilution percent for a verified max supply", async () => {
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 1_000_000,
        citation: "max supply 1000000",
        caveats: null,
      }),
    };
    const market: MarketDataPort = {
      fetchSnapshot: async () => ({
        ok: true,
        data: { circulating: 210_000, price: 1 },
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: `${"a".repeat(DEFAULT_THRESHOLD)} max supply 1000000`,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.report.findings).toEqual([
      { type: "pending_dilution", percent: 79 },
    ]);
    expect(JSON.stringify(result.report)).not.toMatch(
      /saudavel|alerta|healthy|alert|20%/i,
    );
    expect(result.report).not.toHaveProperty("score");
  });

  it("does not emit Pending Dilution when the citation is rejected", async () => {
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 1_000_000,
        citation: "max supply 1000000",
        caveats: null,
      }),
    };
    const market: MarketDataPort = {
      fetchSnapshot: async () => ({
        ok: true,
        data: { circulating: 210_000 },
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: `${"a".repeat(DEFAULT_THRESHOLD)} nothing about supply`,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(
      result.report.findings.some((f) => f.type === "pending_dilution"),
    ).toBe(false);
    expect(result.report.findings).toEqual([{ type: "missing_max_supply" }]);
  });

  it("emits Source Conflict when circulating exceeds max supply", async () => {
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 100,
        citation: "max 100",
        caveats: null,
      }),
    };
    const market: MarketDataPort = {
      fetchSnapshot: async () => ({
        ok: true,
        data: { circulating: 150 },
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: `${"a".repeat(DEFAULT_THRESHOLD)} max 100`,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.report.findings).toEqual([{ type: "source_conflict" }]);
    expect(
      result.report.findings.some((f) => f.type === "pending_dilution"),
    ).toBe(false);
  });

  it("emits Source Conflict when max supply is not positive", async () => {
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 0,
        citation: "max 0",
        caveats: null,
      }),
    };
    const market: MarketDataPort = {
      fetchSnapshot: async () => ({
        ok: true,
        data: { circulating: 10 },
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: `${"a".repeat(DEFAULT_THRESHOLD)} max 0`,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.report.findings).toEqual([{ type: "source_conflict" }]);
  });

  it("keeps a verified Caveat on the Report without changing dilution percent", async () => {
    const caveat = "subject to DAO vote";
    const citation = "max supply 1000000";
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 1_000_000,
        citation,
        caveats: caveat,
      }),
    };
    const market: MarketDataPort = {
      fetchSnapshot: async () => ({
        ok: true,
        data: { circulating: 210_000 },
      }),
    };
    const documentText = `${"a".repeat(DEFAULT_THRESHOLD)} ${citation} ${caveat}`;

    const withCaveat = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText,
      },
      { extractor, market },
    );
    const withoutCaveat = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText,
      },
      {
        extractor: {
          extract: async () => ({
            found: true,
            value: 1_000_000,
            citation,
            caveats: null,
          }),
        },
        market,
      },
    );

    expect(withCaveat.ok && withoutCaveat.ok).toBe(true);
    if (!withCaveat.ok || !withoutCaveat.ok) {
      return;
    }
    expect(withCaveat.report.claims.maxSupplyAmount.caveats).toBe(caveat);
    expect(withCaveat.report.findings).toEqual(withoutCaveat.report.findings);
    expect(withCaveat.report.findings).toEqual([
      { type: "pending_dilution", percent: 79 },
    ]);
  });

  it("drops a Caveat that is not in the Document", async () => {
    const extractor: ExtractorPort = {
      extract: async () => ({
        found: true,
        value: 1_000_000,
        citation: "max supply 1000000",
        caveats: "invented fine print",
      }),
    };
    const market: MarketDataPort = {
      fetchSnapshot: async () => ({
        ok: true,
        data: { circulating: 210_000 },
      }),
    };

    const result = await run(
      {
        onChainId: { chainId: 1, contractAddress: "0xabc" },
        marketAlias: "ethereum",
        documentText: `${"a".repeat(DEFAULT_THRESHOLD)} max supply 1000000`,
      },
      { extractor, market },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.report.claims.maxSupplyAmount.caveats).toBeNull();
  });

  it("persists a retrievable Audit Record after a successful run", async () => {
    const records = createInMemoryAuditRecords();
    const onChainId = { chainId: 1, contractAddress: "0xabc" };
    const documentText = `${"a".repeat(DEFAULT_THRESHOLD)} max supply 1000000`;
    const { extractor, market } = trackingPorts();

    const result = await run(
      {
        onChainId,
        marketAlias: "ethereum",
        documentText,
      },
      {
        extractor: {
          extract: async () => ({
            found: true,
            value: 1_000_000,
            citation: "max supply 1000000",
            caveats: null,
          }),
        },
        market: {
          fetchSnapshot: async () => ({
            ok: true,
            data: { circulating: 210_000 },
          }),
        },
        records,
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.recordId).toEqual(expect.stringMatching(/^rec_/));
    const stored = await records.get(result.recordId ?? "");
    expect(stored).not.toBeNull();
    expect(stored?.document.text).toBe(documentText);
    expect(stored?.document.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored?.token).toEqual({ onChainId, marketAlias: "ethereum" });
    expect(stored?.claims).toEqual(result.report.claims);
    expect(stored?.findings).toEqual(result.report.findings);
    void extractor;
    void market;
  });
});

