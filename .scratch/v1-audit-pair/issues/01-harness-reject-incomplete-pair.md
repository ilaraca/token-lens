# 01: Harness + rejeição de Pair incompleto

**What to build:** Um projeto TypeScript com a seam `Auditor.run` testável: se faltarem On-Chain Id ou Market Alias, ou se o Document for ilegível (abaixo do limiar de caracteres alfanuméricos), a auditoria falha de imediato — sem Report e sem chamar Extrator nem mercado.

**Blocked by:** None (can start immediately).

**Triage:** ready-for-agent

**Kanban:** Done

- [x] Pacote TS strict sobe e a suíte de testes roda
- [x] Ids incompletos → erro (sem Audit Report)
- [x] Document abaixo do limiar (default 500 alfanuméricos) → erro
- [x] Extrator e Market Data não são invocados nesses casos

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

Harness TS strict + Vitest. Seam pública: `run` em `src/packages/auditor`.

Rejeita `incomplete_ids` (On-Chain Id ou Market Alias vazios) e `illegible_document` (alfanuméricos `<` limiar, default 500, configurável). Nessas falhas o resultado é `{ ok: false }` sem `report`; Extractor e Market Data **não** são chamados.

Como verificar: `npm test` e `npm run typecheck` (4 testes no ticket 01).

Pair completo ainda devolve `{ ok: true }` sem chamar as ports — isso é de propósito; o 02 pega o Snapshot.
