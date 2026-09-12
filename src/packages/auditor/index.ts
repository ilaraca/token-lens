import { isVerifiedCitation } from "./lib/citation.js";
import {
  ExtractorClaimSchema,
  type ExtractorClaim,
} from "./lib/claim.js";
import {
  canComputePendingDilution,
  pendingDilutionPercent,
} from "./lib/dilution.js";
import { hashDocumentText } from "./lib/document-hash.js";
import { hasCompleteIds, type OnChainId } from "./lib/ids.js";
import {
  MarketSnapshotSchema,
  type MarketFetchResult,
  type MarketSnapshot,
} from "./lib/market-snapshot.js";
import {
  DEFAULT_READABILITY_THRESHOLD,
  isLegibleDocument,
} from "./lib/readability.js";
import type { AuditRecordRepository } from "./lib/records.js";

export type { OnChainId, MarketSnapshot };
export {
  createInMemoryAuditRecords,
  type AuditRecord,
  type AuditRecordRepository,
} from "./lib/records.js";

export type AuditInput = {
  onChainId?: OnChainId | null;
  marketAlias?: string | null;
  documentText: string;
  readabilityThreshold?: number;
};

export { ExtractorClaimSchema };
export type { ExtractorClaim };

export type ExtractorPort = {
  extract: (documentText: string) => Promise<unknown>;
};

export type MarketDataPort = {
  fetchSnapshot: (marketAlias: string) => Promise<MarketFetchResult>;
};

export type AuditorPorts = {
  extractor: ExtractorPort;
  market: MarketDataPort;
  records?: AuditRecordRepository;
};

export type IncompletePairError =
  | { code: "incomplete_ids" }
  | { code: "illegible_document" }
  | { code: "market_unavailable" }
  | { code: "market_contract_invalid" }
  | { code: "extractor_contract_invalid" };

export type AuditFailure = {
  ok: false;
  error: IncompletePairError;
};

export type Finding =
  | { type: "missing_max_supply" }
  | { type: "pending_dilution"; percent: number }
  | { type: "source_conflict" };

export type ReportedClaim = ExtractorClaim & { verified: boolean };

export type AuditReport = {
  claims: { maxSupplyAmount: ReportedClaim };
  findings: Finding[];
};

export type AuditSuccess = {
  ok: true;
  snapshot: MarketSnapshot;
  report: AuditReport;
  recordId?: string;
};

export type AuditResult = AuditSuccess | AuditFailure;

export async function run(
  input: AuditInput,
  ports: AuditorPorts,
): Promise<AuditResult> {
  if (
    !hasCompleteIds(input.onChainId, input.marketAlias) ||
    !input.marketAlias?.trim()
  ) {
    return { ok: false, error: { code: "incomplete_ids" } };
  }

  const marketAlias = input.marketAlias.trim();

  const threshold = input.readabilityThreshold ?? DEFAULT_READABILITY_THRESHOLD;
  if (!isLegibleDocument(input.documentText, threshold)) {
    return { ok: false, error: { code: "illegible_document" } };
  }

  const fetched = await ports.market.fetchSnapshot(marketAlias);
  if (!fetched.ok) {
    return { ok: false, error: { code: "market_unavailable" } };
  }

  const parsed = MarketSnapshotSchema.safeParse(fetched.data);
  if (!parsed.success) {
    return { ok: false, error: { code: "market_contract_invalid" } };
  }

  const extracted = await ports.extractor.extract(input.documentText);
  const claim = ExtractorClaimSchema.safeParse(extracted);
  if (!claim.success) {
    return { ok: false, error: { code: "extractor_contract_invalid" } };
  }

  const verified =
    !claim.data.found ||
    isVerifiedCitation(claim.data.citation, input.documentText);
  const acceptedCaveats =
    claim.data.caveats &&
    isVerifiedCitation(claim.data.caveats, input.documentText)
      ? claim.data.caveats
      : null;
  const feedsEngine = claim.data.found && verified;
  const findings: Finding[] = [];
  if (!feedsEngine || !claim.data.found) {
    findings.push({ type: "missing_max_supply" });
  } else if (
    canComputePendingDilution(claim.data.value, parsed.data.circulating)
  ) {
    findings.push({
      type: "pending_dilution",
      percent: pendingDilutionPercent(
        claim.data.value,
        parsed.data.circulating,
      ),
    });
  } else {
    findings.push({ type: "source_conflict" });
  }

  const reportedClaim = {
    ...claim.data,
    caveats: acceptedCaveats,
    verified,
  };
  const report = {
    claims: { maxSupplyAmount: reportedClaim },
    findings,
  };

  let recordId: string | undefined;
  if (ports.records) {
    recordId = await ports.records.save({
      document: {
        text: input.documentText,
        hash: hashDocumentText(input.documentText),
      },
      token: {
        onChainId: input.onChainId,
        marketAlias,
      },
      claims: report.claims,
      findings,
    });
  }

  return {
    ok: true,
    snapshot: parsed.data,
    report,
    ...(recordId !== undefined ? { recordId } : {}),
  };
}
