# 09: Adapter real CoinGecko

**What to build:** Implementar o ator real da porta de Market Data via CoinGecko (Market Alias), com validação Zod e Result em falhas, encaixável no mesmo Auditor que já usa o dublê — teste com fixture/HTTP gravado, não flaky live-only.

**Blocked by:** 02 — Perna Market Snapshot (dublê)

**Triage:** ready-for-agent

**Kanban:** Done

- [x] Adapter real satisfaz o mesmo contrato da porta de mercado
- [x] Payload inválido ou erro HTTP → Result de falha (Auditor aborta se esse adapter estiver ligado)
- [x] circulating exposto em human units conforme o contrato do Snapshot
- [x] Teste estável com fixture (sem depender de rede ao vivo na CI)

## Feedback

Ao terminar a implementação: mover Kanban para `Feedback`, preencher a nota abaixo, atualizar `board.md` e **parar** até um humano marcar `Done`.

## Implementation note

`createCoinGeckoMarketData(fetch?)` em `src/packages/market-coingecko` implementa o mesmo `MarketDataPort`. `circulating` ← `market_data.circulating_supply`; `price` ← `market_data.current_price.usd`. HTTP/rede/JSON inválido → `{ ok: false }` (sem throw).

Testes com fixture (`ethereum.json`) e `fetch` injetado — sem rede na CI.

Como verificar: `npm test` (16) e `npm run typecheck`.

Ligar: `run(input, { extractor, market: createCoinGeckoMarketData() })`.
