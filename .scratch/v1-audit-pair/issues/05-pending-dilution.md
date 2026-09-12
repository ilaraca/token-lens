# 05: Pending Dilution

**What to build:** Com `maxSupplyAmount` Found e verificado e circulating no Snapshot, o Report inclui Pending Dilution como percentual `(max - circulating) / max`, sem label de severidade/saúde.

**Blocked by:** 04 — Verificação de citação

**Triage:** ready-for-agent

**Kanban:** Done

- [x] % de diluição pendente correto para um caso feliz
- [x] Nenhum label tipo saudável/alerta/limiar 20%
- [x] Só ocorre com Claim verificado (não com citação rejeitada)

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

Finding `{ type: "pending_dilution", percent }` = `((max - circulating) / max) * 100` (2 casas). Só com Found + citação verificada e `max > 0` e `circulating <= max`. Sem labels de saúde/20%. Citação rejeitada → só `missing_max_supply`.

Exemplo: max 1_000_000, circulating 210_000 → 79.

Como verificar: `npm test` (14 no auditor). Source Conflict fica no 06.
