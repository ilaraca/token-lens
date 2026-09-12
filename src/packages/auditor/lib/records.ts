import type { Finding, OnChainId, ReportedClaim } from "../index.js";

export type AuditRecord = {
  id: string;
  document: { text: string; hash: string };
  token: { onChainId: OnChainId; marketAlias: string };
  claims: { maxSupplyAmount: ReportedClaim };
  findings: Finding[];
};

export type AuditRecordDraft = Omit<AuditRecord, "id">;

export type AuditRecordRepository = {
  save: (record: AuditRecordDraft) => Promise<string>;
  get: (id: string) => Promise<AuditRecord | null>;
};

export function createInMemoryAuditRecords(): AuditRecordRepository {
  const store = new Map<string, AuditRecord>();
  let seq = 0;

  return {
    async save(record) {
      const id = `rec_${++seq}`;
      store.set(id, { ...record, id });
      return id;
    },
    async get(id) {
      return store.get(id) ?? null;
    },
  };
}
