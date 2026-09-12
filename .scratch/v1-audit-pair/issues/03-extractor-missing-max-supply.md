# 03: Extrator (dublê) + Missing Max Supply

**What to build:** Com as três pernas do Audit Pair, um Extrator dublê que devolve `maxSupplyAmount` Absent produz Audit Report cujo Finding é Missing Max Supply — sem score e sem narrativeSummary.

**Blocked by:** 02 — Perna Market Snapshot (dublê)

**Triage:** ready-for-agent

**Kanban:** Done

- [x] Pair completo + Absent Claim → Audit Report retornado
- [x] Finding Missing Max Supply presente
- [x] Report não inclui score nem resumo narrativo
- [x] Contrato Found/Absent do Claim respeitado (Absent ⇒ valor e citação null)

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

Após Snapshot válido, o Auditor chama o Extrator e valida o Claim com Zod (Absent: found false + value/citation null).

Absent → `report.findings` inclui `{ type: "missing_max_supply" }`. Sem campos `score` / `narrativeSummary`. Claim inválido → `extractor_contract_invalid`, sem Report.

Como verificar: `npm test` (9 testes no auditor). Found Claim ainda não vira diluição (04/05).
