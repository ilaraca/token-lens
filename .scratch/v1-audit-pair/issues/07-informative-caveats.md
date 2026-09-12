# 07: Caveats informativos

**What to build:** Ressalvas literais ligadas ao Claim, com substring verificável no Document, aparecem no Audit Report e não alteram o cálculo de Pending Dilution.

**Blocked by:** 05 — Pending Dilution

**Triage:** ready-for-agent

**Kanban:** Done

- [x] Caveat verificado aparece no Report
- [x] Caveat inventado (não está no Document) não é aceito como Caveat
- [x] Percentual de diluição idêntico com ou sem Caveat honesto no mesmo max/circulating

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

Caveat só entra no Report se for substring (mesma Citation Normalization). Inventado → `caveats: null`. Diluição 79% idêntica com ou sem caveat honesto no mesmo max/circulating.
