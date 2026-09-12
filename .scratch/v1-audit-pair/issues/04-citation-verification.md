# 04: Verificação de citação

**What to build:** Found Claims só alimentam o motor se a citação for substring do Document após Citation Normalization (whitespace colapsado + NFC, case-sensitive). Citação inventada é rejeitada; citação literal honesta passa.

**Blocked by:** 03 — Extrator (dublê) + Missing Max Supply

**Triage:** ready-for-agent

**Kanban:** Done

- [x] Citação ausente no Document → Claim não gera Finding de diluição
- [x] Citação literal presente (com quebras de linha/whitespace equivalentes) → Claim verificado
- [x] Match não é fuzzy nem case-insensitive

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

Citation Normalization: NFC + colapsar whitespace; `includes` case-sensitive. Found + citação no Document → `verified: true` e o Claim alimenta o motor (ainda sem diluição). Found + citação inventada ou só diferença de caixa → `verified: false` e Finding `missing_max_supply` (não entra no motor).

Como verificar: `npm test` (12 no auditor).
