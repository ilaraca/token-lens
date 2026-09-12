# Economia de tokens — v1-audit-pair

Heurística Prompt-less: `tokens ≈ chars / 4`. Não é tokenizer oficial nem billing da Cursor.

## Por execução de agente (1 ticket)

| Pacote | Tokens est. |
|--------|-------------|
| Naive (spec + CONTEXT + ADRs + 10 tickets + board + prompt + grill + system/tools longos) | 48,157 |
| Prompt-less (IMPLEMENT.md + 1 ticket + CONTEXT + system/tools curtos) | 2,378 |

Grill/histórico colado no naive: **36,955** tokens (0 se não medido).

## 10 runs (1 por ticket)

| | Tokens est. |
|--|-------------|
| Sem prompt-less (naive × runs) | 481,570 |
| Com prompt-less | 23,780 |
| Economia | 457,790 (**95.1%**) |

## Corpus medido agora

| Artefato | Tokens |
|----------|--------|
| Handoff IMPLEMENT.md | 467 |
| spec.md | 2,391 |
| CONTEXT.md | 1,122 |
| ADRs | 396 |
| Todos os tickets | 1,896 |
| Ticket médio | 189 |
| Board | 293 |
| system-prompt-extractor.txt | 337 |
