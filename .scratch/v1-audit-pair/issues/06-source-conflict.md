# 06: Source Conflict

**What to build:** Quando circulating > maxSupplyAmount ou maxSupplyAmount ≤ 0, o Report emite Source Conflict em vez de suavizar a matemática (sem clamp para 0% “saudável”).

**Blocked by:** 05 — Pending Dilution

**Triage:** ready-for-agent

**Kanban:** Done

- [x] circulating > max → Source Conflict
- [x] max ≤ 0 → Source Conflict
- [x] Não há Pending Dilution “negativa” ou clamp silencioso nesses casos

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

Found verificado + (`circulating > max` ou `max <= 0`) → `{ type: "source_conflict" }`. Sem `pending_dilution` (nada de % negativa nem clamp).

Como verificar: testes “circulating exceeds” e “max supply is not positive”.
