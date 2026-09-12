# 02: Perna Market Snapshot (dublê)

**What to build:** Com Token e Document legível, o Auditor exige Market Snapshot. Dublê de mercado que falha aborta sem Report; dublê que sucede disponibiliza circulating (human units) para o restante do pipeline.

**Blocked by:** 01 — Harness + rejeição de Pair incompleto

**Triage:** ready-for-agent

**Kanban:** Todo

- [ ] Falha do Market Data port → erro, sem Audit Report
- [ ] Sucesso do dublê → Snapshot com circulating em human units no fluxo
- [ ] Resposta de mercado inválida para o contrato → erro (fail-fast), não Report parcial

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

_(vazio)_
