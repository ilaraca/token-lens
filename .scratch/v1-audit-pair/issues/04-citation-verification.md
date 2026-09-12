# 04: Verificação de citação

**What to build:** Found Claims só alimentam o motor se a citação for substring do Document após Citation Normalization (whitespace colapsado + NFC, case-sensitive). Citação inventada é rejeitada; citação literal honesta passa.

**Blocked by:** 03 — Extrator (dublê) + Missing Max Supply

**Triage:** ready-for-agent

**Kanban:** Todo

- [ ] Citação ausente no Document → Claim não gera Finding de diluição
- [ ] Citação literal presente (com quebras de linha/whitespace equivalentes) → Claim verificado
- [ ] Match não é fuzzy nem case-insensitive

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

_(vazio)_
