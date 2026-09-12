# 02: Perna Market Snapshot (dublê)

**What to build:** Com Token e Document legível, o Auditor exige Market Snapshot. Dublê de mercado que falha aborta sem Report; dublê que sucede disponibiliza circulating (human units) para o restante do pipeline.

**Blocked by:** 01 — Harness + rejeição de Pair incompleto

**Triage:** ready-for-agent

**Kanban:** Done

- [x] Falha do Market Data port → erro, sem Audit Report
- [x] Sucesso do dublê → Snapshot com circulating em human units no fluxo
- [x] Resposta de mercado inválida para o contrato → erro (fail-fast), não Report parcial

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

Market Data port devolve Result (`ok` + `data` unknown, ou falha). Auditor chama o dublê só depois dos guards do 01.

- `ok: false` → `market_unavailable`, sem Report, Extrator não é chamado
- payload que falha no Zod (`circulating` number finito, `price` opcional) → `market_contract_invalid`
- sucesso → `{ ok: true, snapshot }` com circulating em human units

Como verificar: `npm test` (7 testes) e `npm run typecheck`. Extrator ainda não entra no happy path — ticket 03.
