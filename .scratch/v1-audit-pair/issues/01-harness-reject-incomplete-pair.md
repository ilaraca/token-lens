# 01: Harness + rejeição de Pair incompleto

**What to build:** Um projeto TypeScript com a seam `Auditor.run` testável: se faltarem On-Chain Id ou Market Alias, ou se o Document for ilegível (abaixo do limiar de caracteres alfanuméricos), a auditoria falha de imediato — sem Report e sem chamar Extrator nem mercado.

**Blocked by:** None (can start immediately).

**Triage:** ready-for-agent

**Kanban:** Todo

- [ ] Pacote TS strict sobe e a suíte de testes roda
- [ ] Ids incompletos → erro (sem Audit Report)
- [ ] Document abaixo do limiar (default 500 alfanuméricos) → erro
- [ ] Extrator e Market Data não são invocados nesses casos

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

_(vazio)_
