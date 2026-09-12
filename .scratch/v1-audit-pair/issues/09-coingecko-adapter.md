# 09: Adapter real CoinGecko

**What to build:** Implementar o ator real da porta de Market Data via CoinGecko (Market Alias), com validação Zod e Result em falhas, encaixável no mesmo Auditor que já usa o dublê — teste com fixture/HTTP gravado, não flaky live-only.

**Blocked by:** 02 — Perna Market Snapshot (dublê)

**Triage:** ready-for-agent

**Kanban:** Todo

- [ ] Adapter real satisfaz o mesmo contrato da porta de mercado
- [ ] Payload inválido ou erro HTTP → Result de falha (Auditor aborta se esse adapter estiver ligado)
- [ ] circulating exposto em human units conforme o contrato do Snapshot
- [ ] Teste estável com fixture (sem depender de rede ao vivo na CI)

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

_(vazio)_
